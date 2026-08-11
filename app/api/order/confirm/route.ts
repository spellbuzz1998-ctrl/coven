import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/db'
import { getOrderById } from '@/lib/orders'

// Called from the order-confirm page after Stripe redirects back.
// The payment status is verified directly with Stripe — the client
// cannot mark an order as paid on its own.
export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()
    if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const orderId = pi.metadata?.orderId
    if (!orderId) return NextResponse.json({ error: 'No order attached to payment' }, { status: 400 })

    const order = getOrderById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const db = getDb()
    if (order.status === 'pending') {
      const email = pi.receipt_email || order.customerEmail || ''
      db.prepare('UPDATE orders SET status = ?, stripe_payment_id = ?, customer_email = ?, updated_at = ? WHERE id = ?')
        .run('paid', pi.id, email, new Date().toISOString(), orderId)
      if (order.couponCode) {
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(order.couponCode)
      }
    }

    return NextResponse.json({ ok: true, orderId, total: order.total })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[order-confirm]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
