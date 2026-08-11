import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const ALLOWED_METHODS = ['card', 'paypal', 'klarna'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const paymentIntentId = typeof body?.paymentIntentId === 'string' ? body.paymentIntentId : ''
    const method = typeof body?.method === 'string' && (ALLOWED_METHODS as readonly string[]).includes(body.method) ? body.method : ''

    if (!paymentIntentId.startsWith('pi_') || !method) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const updated = await stripe.paymentIntents.update(paymentIntentId, {
      payment_method_types: [method],
    })

    return NextResponse.json({ clientSecret: updated.client_secret })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[update-payment-method]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
