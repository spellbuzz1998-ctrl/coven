'use client'
import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent,
} from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Deliberately minimal. An earlier version also set layout.maxRows/overflow,
// buttonType and paymentMethods.applePay:'always' all at once, and the button
// stopped rendering entirely — so only the options needed to drop the
// "See more" expander are set, and applePay/googlePay are left on their
// 'auto' default rather than being forced.
//
// 'never' on the others is what removes the expander: without it Stripe also
// offers Link/PayPal/Klarna here and hides the overflow behind "See more".
function expressOptions(height: number) {
  return {
    buttonHeight: height,
    buttonBorderRadius: Math.round(height / 2),
    buttonTheme: { applePay: 'black', googlePay: 'black' },
    paymentMethods: {
      link: 'never',
      paypal: 'never',
      klarna: 'never',
      amazonPay: 'never',
    },
  } as const
}

export interface ExpressLineItem {
  productId: string
  quantity: number
  variantIdx?: number
  personalization?: string
}

interface Props {
  /** Charge amount in dollars — drives the sheet total. */
  amount: number
  item: ExpressLineItem
  /** Pixel height, so the button matches the Add to cart beside it. */
  height?: number
  /** Return false to block the sheet from opening (e.g. no variant chosen). */
  validate?: () => boolean
  onReady?: (hasWallet: boolean) => void
}

// `amount` is consumed by the Elements provider below, not in here.
function ExpressInner({ item, height = 52, validate, onReady }: Omit<Props, 'amount'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')

  // Runs before the wallet sheet opens. Not calling resolve() keeps it shut,
  // which is how we stop a purchase with no variant selected.
  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      if (validate && !validate()) return
      setError('')
      event.resolve({
        emailRequired: true,
        business: { name: 'ThirteenCoven' },
      })
    },
    [validate]
  )

  const handleConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (!stripe || !elements) return

      const fail = (msg: string) => {
        setError(msg)
        event.paymentFailed({ reason: 'fail' })
      }

      // Required before creating the intent in deferred mode.
      const submitResult = await elements.submit()
      if (submitResult.error) {
        fail(submitResult.error.message || 'Could not start the payment.')
        return
      }

      // The server re-prices from the database — the amount above is only what
      // the wallet sheet displays.
      const email = event.billingDetails?.email ?? ''
      let clientSecret = ''
      try {
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [item], email }),
        })
        const data = await res.json()
        if (!res.ok || !data?.clientSecret) {
          fail(data?.error || 'Could not start the payment. Please try again.')
          return
        }
        clientSecret = data.clientSecret
      } catch {
        fail('Could not reach the payment service. Please check your connection.')
        return
      }

      // Wallets are the flow most likely to leave us without an address to
      // deliver the reading to, so persist it before confirming.
      if (email) {
        try {
          await fetch('/api/checkout/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId: clientSecret.split('_secret_')[0], email }),
          })
        } catch {
          // Non-fatal — the intent already carries receipt_email.
        }
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: `${window.location.origin}/order/confirm` },
      })
      if (confirmError) fail(confirmError.message || 'Payment could not be completed.')
    },
    [stripe, elements, item]
  )

  return (
    <div>
      <ExpressCheckoutElement
        onClick={handleClick}
        onConfirm={handleConfirm}
        onReady={({ availablePaymentMethods }) => onReady?.(!!availablePaymentMethods)}
        options={expressOptions(height)}
      />
      {error && (
        <p className="text-xs mt-1.5" style={{ color: '#dc2626' }} role="alert">{error}</p>
      )}
    </div>
  )
}

/**
 * One-tap wallet checkout on the product page. Opens the Apple Pay / Google Pay
 * sheet directly rather than routing through /checkout.
 *
 * Uses Stripe's deferred-intent mode: the PaymentIntent is created inside
 * onConfirm, so tapping the button doesn't require one to exist already and we
 * never create intents for people who only browse.
 */
export default function ExpressBuyButton(props: Props) {
  return (
    // Remount when the price changes so the sheet always shows the right total.
    <Elements
      key={props.amount}
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: Math.max(Math.round(props.amount * 100), 50),
        currency: 'usd',
      }}
    >
      <ExpressInner {...props} />
    </Elements>
  )
}
