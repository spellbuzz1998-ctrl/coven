'use client'
import { useCart } from '@/lib/cart'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, ExpressCheckoutElement, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Static style objects — defined once instead of rebuilt on every render.
const CARD_ELEMENT_STYLE = {
  base: { fontSize: '15px', color: '#1a1040', '::placeholder': { color: '#9ca3af' } },
} as const

const EXPRESS_OPTIONS = {
  buttonHeight: 52,
  buttonTheme: { applePay: 'black', googlePay: 'black' },
} as const

// Saves the buyer's email against the pending order before payment is confirmed.
// PayPal / Klarna / wallet flows never give Stripe an email on their own.
async function saveContactEmail(clientSecret: string, email: string) {
  const paymentIntentId = clientSecret.split('_secret_')[0]
  try {
    await fetch('/api/checkout/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, email }),
    })
  } catch {
    // Non-fatal: the card path still passes receipt_email to Stripe directly.
  }
}

function ExpressWallet({ clientSecret, email, onReady }: { clientSecret: string; email: string; onReady: (hasWallet: boolean) => void }) {
  const stripe = useStripe()
  const elements = useElements()

  async function handleConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!stripe || !elements) return
    // Wallets supply their own billing email; fall back to the typed one.
    if (EMAIL_RE.test(email)) await saveContactEmail(clientSecret, email)
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/order/confirm` },
    })
    if (error) event.paymentFailed({ reason: 'fail' })
  }

  return (
    <ExpressCheckoutElement
      onConfirm={handleConfirm}
      onReady={({ availablePaymentMethods }) => onReady(!!availablePaymentMethods)}
      options={EXPRESS_OPTIONS}
    />
  )
}

interface PaymentFormProps {
  email: string
  onEmailChange: (e: string) => void
  clientSecret: string
  onSecretChange: (s: string) => void
  couponCode?: string
  onApplyCoupon: (code: string) => Promise<string | null>
  onRemoveCoupon: () => void
}

function PaymentForm({ email, onEmailChange, clientSecret, onSecretChange, couponCode, onApplyCoupon, onRemoveCoupon }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [nameOnCard, setNameOnCard] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'klarna'>('card')
  const [methodLoading, setMethodLoading] = useState(false)
  const [showDiscount, setShowDiscount] = useState(!!couponCode)
  const [discountCode, setDiscountCode] = useState(couponCode ?? '')
  const [discountBusy, setDiscountBusy] = useState(false)
  const [discountError, setDiscountError] = useState('')

  const emailValid = EMAIL_RE.test(email)

  async function switchMethod(method: 'card' | 'paypal' | 'klarna') {
    if (method === paymentMethod || methodLoading) return
    const previous = paymentMethod
    setPaymentMethod(method)
    setMethodLoading(true)
    setError('')
    const piId = clientSecret.split('_secret_')[0]
    try {
      const res = await fetch('/api/update-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: piId, method }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) {
        setError(data.error || 'Could not switch payment method. Please try again.')
        setPaymentMethod(previous)
      } else if (data.clientSecret) {
        onSecretChange(data.clientSecret)
      }
    } catch {
      setError('Could not switch payment method. Please check your connection.')
      setPaymentMethod(previous)
    } finally {
      setMethodLoading(false)
    }
  }

  async function handleApplyDiscount() {
    const code = discountCode.trim().toUpperCase()
    if (!code || discountBusy) return
    setDiscountBusy(true)
    setDiscountError('')
    const err = await onApplyCoupon(code)
    if (err) setDiscountError(err)
    setDiscountBusy(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Guard against a second submit while the first is still in flight.
    if (loading || methodLoading) return
    if (!stripe || !elements || !agreed) return
    if (!emailValid) {
      setError('Please enter a valid email address so we can deliver your order.')
      return
    }
    setLoading(true)
    setError('')

    const returnUrl = `${window.location.origin}/order/confirm`

    // Persist the email before handing off — redirect-based methods never come back here.
    await saveContactEmail(clientSecret, email)

    if (paymentMethod === 'paypal') {
      const { error: stripeError } = await stripe.confirmPayPalPayment(clientSecret, {
        return_url: returnUrl,
      })
      if (stripeError) {
        setError(stripeError.message ?? 'PayPal payment failed')
        setLoading(false)
      }
      return
    }

    if (paymentMethod === 'klarna') {
      const { error: stripeError } = await stripe.confirmKlarnaPayment(clientSecret, {
        payment_method: {
          billing_details: {
            email,
            address: { country: 'US' },
          },
        },
        return_url: returnUrl,
      })
      if (stripeError) {
        setError(stripeError.message ?? 'Klarna payment failed')
        setLoading(false)
      }
      return
    }

    const cardElement = elements.getElement(CardNumberElement)
    if (!cardElement) {
      setError('The card form is still loading. Please try again in a moment.')
      setLoading(false)
      return
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { email, ...(nameOnCard.trim() ? { name: nameOnCard.trim() } : {}) },
      },
      receipt_email: email,
    })

    if (!stripeError) {
      const pi = paymentIntent?.id ? `?payment_intent=${paymentIntent.id}` : ''
      window.location.href = `${returnUrl}${pi}`
      return
    }

    setError(stripeError.message ?? 'Payment failed')
    setLoading(false)
  }

  const submitDisabled = loading || methodLoading || !stripe || !agreed || !emailValid

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="checkout-email" className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1040' }}>
          Email address *
        </label>
        <input
          id="checkout-email"
          type="email"
          required
          autoComplete="email"
          aria-describedby="checkout-email-hint"
          className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          style={{ borderColor: email && !emailValid ? '#dc2626' : '#d1d5db' }}
          placeholder="your@email.com"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
        />
        <p id="checkout-email-hint" className="text-xs mt-1" style={{ color: email && !emailValid ? '#dc2626' : '#6b7280' }}>
          {email && !emailValid
            ? 'Please enter a valid email address.'
            : 'Your reading or ritual report is delivered to this address.'}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold" style={{ color: '#1a1040' }}>Payment</h3>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: '#6b7280' }}>All transactions are secure and encrypted.</p>

        <div className="border rounded-lg overflow-hidden" style={{ borderColor: paymentMethod === 'card' ? '#1a1040' : '#d1d5db' }}>
          <button
            type="button"
            onClick={() => switchMethod('card')}
            aria-pressed={paymentMethod === 'card'}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ backgroundColor: paymentMethod === 'card' ? '#f3f4f6' : '#fff', borderBottom: paymentMethod === 'card' ? '1px solid #d1d5db' : 'none' }}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full block" style={{ border: paymentMethod === 'card' ? '5px solid #1a1040' : '2px solid #d1d5db' }} />
              <span className="text-sm font-medium" style={{ color: '#1a1040' }}>Credit card</span>
            </span>
            <span className="flex items-center gap-1.5">
              {/* Visa */}
              <span className="inline-flex items-center justify-center rounded" style={{ width: 38, height: 24, backgroundColor: '#1a1f71' }}>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, fontStyle: 'italic', fontFamily: 'Arial, sans-serif', letterSpacing: -0.5 }}>VISA</span>
              </span>
              {/* Mastercard */}
              <span className="inline-flex items-center justify-center rounded" style={{ width: 38, height: 24, backgroundColor: '#fff', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
                <svg width="30" height="18" viewBox="0 0 30 18" aria-hidden="true"><circle cx="11" cy="9" r="7" fill="#EB001B"/><circle cx="19" cy="9" r="7" fill="#F79E1B"/><path d="M15 3.4a7 7 0 0 1 2.5 5.6A7 7 0 0 1 15 14.6 7 7 0 0 1 12.5 9 7 7 0 0 1 15 3.4z" fill="#FF5F00"/></svg>
              </span>
              {/* Amex */}
              <span className="inline-flex items-center justify-center rounded" style={{ width: 38, height: 24, backgroundColor: '#016fd0' }}>
                <span style={{ color: '#fff', fontSize: 8, fontWeight: 800, fontFamily: 'Arial, sans-serif', letterSpacing: 0.5 }}>AMEX</span>
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>+5</span>
            </span>
          </button>

          {paymentMethod === 'card' && (
          <div className="bg-white">
            <div className="flex items-center px-4 py-3.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex-1">
                <CardNumberElement options={{ style: CARD_ELEMENT_STYLE, placeholder: 'Card number' }} />
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <CardExpiryElement options={{ style: CARD_ELEMENT_STYLE, placeholder: 'Expiration date (MM / YY)' }} />
            </div>
            <div className="flex items-center px-4 py-3.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div className="flex-1">
                <CardCvcElement options={{ style: CARD_ELEMENT_STYLE, placeholder: 'Security code' }} />
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div className="px-4 py-3.5">
              <label htmlFor="name-on-card" className="sr-only">Name on card</label>
              <input
                id="name-on-card"
                type="text"
                autoComplete="cc-name"
                placeholder="Name on card"
                value={nameOnCard}
                onChange={e => setNameOnCard(e.target.value)}
                className="w-full text-[15px] outline-none bg-transparent"
                style={{ color: '#1a1040' }}
              />
            </div>
          </div>
          )}
        </div>

        {/* PayPal option */}
        <button
          type="button"
          onClick={() => switchMethod('paypal')}
          aria-pressed={paymentMethod === 'paypal'}
          className="w-full flex items-center justify-between px-4 py-3 border rounded-lg mt-2 text-left"
          style={{ borderColor: paymentMethod === 'paypal' ? '#1a1040' : '#d1d5db', backgroundColor: paymentMethod === 'paypal' ? '#fafafa' : '#fff' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 block" style={{ borderColor: paymentMethod === 'paypal' ? '#1a1040' : '#d1d5db' }}>
              {paymentMethod === 'paypal' && <span className="w-full h-full rounded-full block" style={{ backgroundColor: '#1a1040', transform: 'scale(0.5)' }} />}
            </span>
            <svg width="70" height="20" viewBox="0 0 70 20" role="img" aria-label="PayPal"><text x="0" y="16" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold"><tspan fill="#003087">Pay</tspan><tspan fill="#009cde">Pal</tspan></text></svg>
          </span>
        </button>

        {/* Klarna option */}
        <button
          type="button"
          onClick={() => switchMethod('klarna')}
          aria-pressed={paymentMethod === 'klarna'}
          className="w-full flex items-center justify-between px-4 py-3 border rounded-lg mt-2 text-left"
          style={{ borderColor: paymentMethod === 'klarna' ? '#1a1040' : '#d1d5db', backgroundColor: paymentMethod === 'klarna' ? '#fafafa' : '#fff' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 block" style={{ borderColor: paymentMethod === 'klarna' ? '#1a1040' : '#d1d5db' }}>
              {paymentMethod === 'klarna' && <span className="w-full h-full rounded-full block" style={{ backgroundColor: '#1a1040', transform: 'scale(0.5)' }} />}
            </span>
            <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5" style={{ backgroundColor: '#FFB3C7' }}>
              <span style={{ color: '#0A0B09', fontSize: 13, fontWeight: 800, fontFamily: 'Arial, sans-serif', letterSpacing: -0.3 }}>klarna.</span>
            </span>
            <span className="text-xs" style={{ color: '#6b7280' }}>4 interest-free payments</span>
          </span>
        </button>

        {methodLoading && (
          <p className="text-xs mt-2" style={{ color: '#6b7280' }} role="status">Updating payment method…</p>
        )}

        {/* Discount code */}
        <div className="mt-4">
          {!showDiscount ? (
            <button type="button" onClick={() => setShowDiscount(true)} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: '#1a1040' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Add discount code
            </button>
          ) : (
            <div>
              <div className="flex gap-2">
                <label htmlFor="discount-code" className="sr-only">Discount code</label>
                <input
                  id="discount-code"
                  type="text"
                  value={discountCode}
                  onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError('') }}
                  placeholder="Discount code"
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-200"
                  style={{ borderColor: discountError ? '#dc2626' : '#d1d5db', color: '#1a1040' }}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountBusy || !discountCode.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#1a1040' }}
                >
                  {discountBusy ? 'Checking…' : 'Apply'}
                </button>
              </div>
              {discountError && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{discountError}</p>}
              {couponCode && !discountError && (
                <p className="text-xs mt-1 flex items-center gap-2" style={{ color: '#16a34a' }}>
                  ✓ {couponCode} applied
                  <button type="button" onClick={onRemoveCoupon} className="underline" style={{ color: '#6b7280' }}>Remove</button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>}

      <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-violet-700 cursor-pointer"
        />
        <span className="text-xs leading-relaxed" style={{ color: '#374151' }}>
          I understand and agree to the{' '}
          <Link href="/terms" target="_blank" className="underline font-medium" style={{ color: '#1a1040' }}>Terms &amp; Conditions</Link>,{' '}
          <Link href="/disclaimer" target="_blank" className="underline font-medium" style={{ color: '#1a1040' }}>Disclaimer</Link>, and{' '}
          <Link href="/refund-policy" target="_blank" className="underline font-medium" style={{ color: '#1a1040' }}>Refund Policy</Link>.
        </span>
      </label>

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full py-3.5 rounded-lg font-bold text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#1a1040' }}
      >
        {loading ? 'Processing…' : paymentMethod === 'paypal' ? 'Pay with PayPal' : paymentMethod === 'klarna' ? 'Pay with Klarna' : 'Pay'}
      </button>

      <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2.5 rounded-full mx-auto w-fit" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span className="text-xs font-semibold" style={{ color: '#15803d' }}>Secure checkout powered by Stripe</span>
      </div>
    </form>
  )
}

export default function CheckoutClient() {
  const { items, coupon, listSubtotal, saleDiscount, discountAmount, grandTotal, setCoupon } = useCart()
  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [walletReady, setWalletReady] = useState(false)
  const [serverTotal, setServerTotal] = useState<number | null>(null)

  const itemsTotal = listSubtotal()
  const sale = saleDiscount()
  const discount = discountAmount()
  const couponCode = coupon?.code
  const orderTotal = serverTotal ?? grandTotal()

  // Latest values without making them effect dependencies — re-pricing should be
  // driven by the cart signature below, not by every render of the summary.
  const orderIdRef = useRef<string | null>(null)
  const clientSecretRef = useRef('')
  useEffect(() => { orderIdRef.current = orderId }, [orderId])
  useEffect(() => { clientSecretRef.current = clientSecret }, [clientSecret])

  // A stable description of what's actually being bought. Quantity changes and
  // coupon changes are included, so the total is always re-priced server-side.
  const cartSignature = useMemo(
    () => JSON.stringify({
      items: items.map(i => ({ p: i.productId, v: i.variantIdx ?? null, q: i.quantity, z: i.personalization ?? '' })),
      c: couponCode ?? '',
    }),
    [items, couponCode]
  )

  const createIntent = useCallback(async (signature: string, abort: AbortSignal) => {
    const { items: sigItems, c } = JSON.parse(signature) as {
      items: { p: string; v: number | null; q: number; z: string }[]
      c: string
    }
    if (sigItems.length === 0) return

    // Yield before touching state so this never runs synchronously inside the
    // effect body that calls it.
    await Promise.resolve()
    if (abort.aborted) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort,
        body: JSON.stringify({
          // The server re-prices every item from the database — we only say what's in the cart
          items: sigItems.map(i => ({
            productId: i.p,
            variantIdx: i.v,
            quantity: i.q,
            personalization: i.z || undefined,
          })),
          couponCode: c || undefined,
          orderId: orderIdRef.current,
          paymentIntentId: clientSecretRef.current ? clientSecretRef.current.split('_secret_')[0] : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (abort.aborted) return
      if (!res.ok || data.error) {
        setError(data.error || 'We could not start your checkout. Please try again.')
      } else {
        setClientSecret(data.clientSecret)
        if (data.orderId) setOrderId(data.orderId)
        if (typeof data.amount === 'number') setServerTotal(data.amount)
      }
    } catch (err) {
      if (abort.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
      setError('We could not reach the payment service. Please check your connection and try again.')
    } finally {
      if (!abort.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Abort in-flight requests so a fast cart edit can't apply a stale price.
    const controller = new AbortController()
    // Synchronising with Stripe (an external system) is the intended use of an
    // effect. State writes happen after an await; stale responses are aborted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    createIntent(cartSignature, controller.signal)
    return () => controller.abort()
  }, [cartSignature, createIntent])

  // Validate and apply a coupon typed on the checkout page. Returns an error
  // message, or null on success — re-pricing happens via the cart signature.
  const handleApplyCoupon = useCallback(async (code: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/coupon?code=${encodeURIComponent(code)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return 'Could not check that code. Please try again.'
      if (!data.valid) {
        if (data.reason === 'expired') return 'That code has expired.'
        if (data.reason === 'used_up') return 'That code has reached its usage limit.'
        return 'That discount code is not valid.'
      }
      setCoupon({ code, discount: data.amount, type: data.type === 'fixed' ? 'fixed' : 'percentage' })
      return null
    } catch {
      return 'Could not check that code. Please check your connection.'
    }
  }, [setCoupon])

  const handleRemoveCoupon = useCallback(() => setCoupon(null), [setCoupon])

  const retry = useCallback(() => {
    const controller = new AbortController()
    createIntent(cartSignature, controller.signal)
  }, [cartSignature, createIntent])

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
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#6b6670' }} role="status">Loading payment form…</div>
          ) : error ? (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }} role="alert">
              <p className="text-sm mb-3" style={{ color: '#b91c1c' }}>{error}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={retry}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: '#1a1040' }}
                >
                  Try again
                </button>
                <Link href="/cart" className="px-4 py-2 rounded-full text-sm font-semibold border" style={{ borderColor: '#1a1040', color: '#1a1040' }}>
                  Back to cart
                </Link>
              </div>
            </div>
          ) : clientSecret ? (
            <>
              {/* Express wallet — Apple Pay / Google Pay (only renders when a wallet is available) */}
              <div className={walletReady ? 'mb-4' : ''}>
                <Elements
                  key={`express-${clientSecret}`}
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: 'stripe' } }}
                >
                  <ExpressWallet clientSecret={clientSecret} email={email} onReady={setWalletReady} />
                </Elements>
              </div>
              {walletReady && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 border-t" style={{ borderColor: '#e5e7eb' }} />
                  <span className="text-xs font-medium" style={{ color: '#6b7280' }}>or pay with card</span>
                  <div className="flex-1 border-t" style={{ borderColor: '#e5e7eb' }} />
                </div>
              )}
              {/* Card form */}
              <Elements
                key={`card-${clientSecret}`}
                stripe={stripePromise}
                options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1a1040' } } }}
              >
                <PaymentForm
                  email={email}
                  onEmailChange={setEmail}
                  clientSecret={clientSecret}
                  onSecretChange={setClientSecret}
                  couponCode={couponCode}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={handleRemoveCoupon}
                />
              </Elements>
            </>
          ) : (
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }} role="alert">
              <p className="text-sm mb-3" style={{ color: '#b91c1c' }}>We could not initialise payment. Please try again.</p>
              <button onClick={retry} className="px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#1a1040' }}>
                Try again
              </button>
            </div>
          )}
        </div>

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
                  <span className="font-medium shrink-0">${((item.listPrice ?? item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#6b6670' }}>Item(s) total</span>
                <span>${itemsTotal.toFixed(2)}</span>
              </div>
              {sale > 0 && (
                <div className="flex justify-between" style={{ color: '#15803d' }}>
                  <span>Shop sale discount</span>
                  <span>-${sale.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between" style={{ color: '#15803d' }}>
                  <span>Coupon{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: '#6b6670' }}>Shipping</span>
                <span className="font-medium" style={{ color: '#15803d' }}>Free</span>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold">
              <span>Estimated total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
