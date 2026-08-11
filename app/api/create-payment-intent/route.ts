import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { getActiveSale, getDb } from '@/lib/db'
import { createOrder, replacePendingOrder } from '@/lib/orders'

interface CheckoutItem {
  productId: string
  variantIdx?: number | null
  quantity: number
  personalization?: string
}

interface CouponRow {
  code: string
  discount_type: string
  amount: number
  usage_limit: number | null
  used_count: number
  min_order_amount: number | null
  expires_at: string | null
}

// Prices are always computed server-side from the database — the client
// only tells us WHAT is being bought, never how much it costs.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items = body?.items as CheckoutItem[] | undefined
    const couponCode = typeof body?.couponCode === 'string' ? body.couponCode.toUpperCase() : undefined
    const email = typeof body?.email === 'string' ? body.email.slice(0, 200) : ''
    // When the cart or coupon changes we re-price the SAME pending order rather
    // than leaving a trail of abandoned order rows and payment intents behind.
    const existingOrderId = typeof body?.orderId === 'string' ? body.orderId : undefined
    const existingIntentId = typeof body?.paymentIntentId === 'string' && body.paymentIntentId.startsWith('pi_')
      ? body.paymentIntentId
      : undefined

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })
    }

    // Shop-wide sale (only while it hasn't ended) — same source as the storefront display
    const saleDiscount = getActiveSale().saleDiscount ?? 0

    // Price every line item from the database
    let subtotal = 0
    const orderItems: { productId: string; quantity: number; price: number; personalization?: string }[] = []
    const titles: string[] = []

    for (const item of items) {
      const product = item?.productId ? getProductById(item.productId) : null
      if (!product || !product.isActive) {
        return NextResponse.json({ error: 'One of the items is no longer available' }, { status: 400 })
      }
      const quantity = Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), 20)

      const variants = product.variants ?? []
      const variant = typeof item.variantIdx === 'number' ? variants[item.variantIdx] : undefined
      // A product that defines variants must be bought as one of them, otherwise
      // the buyer could check out at the base price and skip the variant upcharge.
      if (variants.length > 0 && !variant) {
        return NextResponse.json(
          { error: `Please choose an option for "${product.title}" before checking out.` },
          { status: 400 }
        )
      }

      let unit = variant ? variant.price : product.price
      if (!Number.isFinite(unit) || unit < 0) {
        return NextResponse.json({ error: 'One of the items is priced incorrectly' }, { status: 400 })
      }
      if (saleDiscount) unit = parseFloat((unit * (1 - saleDiscount / 100)).toFixed(2))

      subtotal += unit * quantity
      orderItems.push({
        productId: product.id,
        quantity,
        price: unit,
        personalization: typeof item.personalization === 'string' ? item.personalization.slice(0, 1000) : undefined,
      })
      titles.push(variant ? `${product.title} — ${variant.name}` : product.title)
    }
    subtotal = Math.round(subtotal * 100) / 100

    // Validate coupon server-side
    let discount = 0
    let appliedCoupon: string | undefined
    if (couponCode) {
      const db = getDb()
      const row = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(couponCode) as CouponRow | undefined
      const expired = row?.expires_at ? Date.now() > new Date(row.expires_at).getTime() : false
      const usedUp = row?.usage_limit != null ? row.used_count >= row.usage_limit : false
      const belowMin = row?.min_order_amount != null ? subtotal < row.min_order_amount : false
      if (row && !expired && !usedUp && !belowMin) {
        discount = row.discount_type === 'fixed'
          ? Math.min(row.amount, subtotal)
          : Math.round(subtotal * row.amount / 100 * 100) / 100
        appliedCoupon = row.code
      }
    }

    const total = Math.round((subtotal - discount) * 100) / 100
    if (total < 0.5) {
      return NextResponse.json({ error: 'Order total is too low to process' }, { status: 400 })
    }

    // Record the order BEFORE payment so personalization details are never lost
    const reused = existingOrderId
      ? replacePendingOrder(existingOrderId, {
          total,
          couponCode: appliedCoupon,
          discountAmount: discount,
          items: orderItems,
        })
      : null

    const order = reused ?? createOrder({
      customerEmail: email,
      total,
      couponCode: appliedCoupon,
      discountAmount: discount,
      items: orderItems,
    })

    const amountInCents = Math.round(total * 100)
    const metadata = { orderId: order.id, items: titles.join(', ').slice(0, 500) }

    // Reuse the existing intent when we reused the order, so the buyer doesn't
    // end up with several open payment intents for one checkout session.
    if (reused && existingIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(existingIntentId)
        if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
          const updated = await stripe.paymentIntents.update(existingIntentId, {
            amount: amountInCents,
            ...(email ? { receipt_email: email } : {}),
            metadata,
          })
          return NextResponse.json({ clientSecret: updated.client_secret, amount: total, orderId: order.id })
        }
      } catch {
        // Fall through and create a fresh intent.
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      ...(email ? { receipt_email: email } : {}),
      metadata,
      payment_method_types: ['card'],
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount: total, orderId: order.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[create-payment-intent]', message)
    // Don't echo internal error text to the browser — it can leak Stripe/DB details.
    return NextResponse.json(
      { error: 'We could not start your checkout. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
