import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { updateOrderEmail } from '@/lib/orders'

// Records the buyer's email against the pending order *before* they pay.
//
// Card payments hand Stripe a receipt_email at confirm time, but PayPal, Klarna
// and the Apple/Google Pay wallet buttons do not — so without this the order row
// is saved with an empty customer_email and the digital service can't be delivered.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paymentIntentId = typeof body?.paymentIntentId === 'string' ? body.paymentIntentId : ''
    const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : ''

    if (!paymentIntentId.startsWith('pi_') || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    // Only allow this on an intent that hasn't been paid yet.
    if (pi.status === 'succeeded' || pi.status === 'canceled') {
      return NextResponse.json({ error: 'This payment is already complete' }, { status: 409 })
    }

    const orderId = pi.metadata?.orderId
    if (!orderId) return NextResponse.json({ error: 'No order attached to payment' }, { status: 400 })

    await stripe.paymentIntents.update(paymentIntentId, { receipt_email: email })
    updateOrderEmail(orderId, email)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[checkout-contact]', message)
    return NextResponse.json({ error: 'Could not save your email' }, { status: 500 })
  }
}
