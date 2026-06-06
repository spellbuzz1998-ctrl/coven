'use client'
import { useCart } from '@/lib/cart'
import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ total, email, onEmailChange }: { total: number; email: string; onEmailChange: (e: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !email) return
    setLoading(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/confirm`,
        receipt_email: email,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1040' }}>
          Email address *
        </label>
        <input
          type="email"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          placeholder="your@email.com"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1040' }}>
          Payment details
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <PaymentElement />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3.5 rounded-full font-bold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#1a1040' }}
      >
        {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: '#6b6670' }}>
        🔒 Secure checkout powered by Stripe
      </p>
    </form>
  )
}

export default function CheckoutClient() {
  const { items, total, count } = useCart()
  const [clientSecret, setClientSecret] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orderTotal = total()

  useEffect(() => {
    if (items.length === 0) return
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: orderTotal,
        email,
        metadata: { items: items.map(i => i.title).join(', ').slice(0, 500) },
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          setLoading(false)
        } else {
          setClientSecret(data.clientSecret)
          setLoading(false)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, []) // intentionally run once on mount

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="mb-4" style={{ color: '#6b6670' }}>Your cart is empty.</p>
        <Link href="/" className="text-sm underline">Back to shop</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment */}
        <div className="lg:col-span-3">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          {loading ? (
            <div className="text-center py-8" style={{ color: '#6b6670' }}>Loading payment form...</div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: '#1a1040' },
                },
              }}
            >
              <PaymentForm total={orderTotal} email={email} onEmailChange={setEmail} />
            </Elements>
          ) : (
            <p className="text-red-500 text-sm">Failed to initialize payment. Please try again.</p>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-bold mb-4 text-sm uppercase tracking-wide" style={{ color: '#6b6670' }}>
              Order summary
            </h2>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="line-clamp-2 flex-1 mr-2" style={{ color: '#374151' }}>
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
