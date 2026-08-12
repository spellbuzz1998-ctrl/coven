'use client'
import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

export type WalletBrand = 'applePay' | 'googlePay' | null

let stripePromise: ReturnType<typeof loadStripe> | null = null
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Cached across mounts — the answer can't change during a page session, and
// asking Stripe on every product page would be wasted work.
let cached: WalletBrand | undefined

/**
 * Which express-pay button this visitor can actually use.
 *
 * Deliberately asks Stripe rather than sniffing the user agent: an iPhone with
 * no card in Wallet, or Chrome with no saved card, cannot pay. Showing a
 * "Buy with Pay" button to those visitors sends them to a sheet that
 * cannot complete, which is worse than the plain button.
 *
 * Returns null until detection finishes, and on the server pass, so the button
 * renders its neutral label first and only upgrades once confirmed.
 */
export function useWalletBrand(amount: number): WalletBrand {
  const [brand, setBrand] = useState<WalletBrand>(cached ?? null)

  useEffect(() => {
    if (cached !== undefined) return
    let active = true

    getStripe()
      .then(stripe => {
        if (!stripe || !active) return null
        // Stripe requires a positive integer amount, so guard bad prices.
        const cents = Math.round(amount * 100)
        const pr = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: { label: 'Total', amount: cents > 0 ? cents : 100 },
          requestPayerName: true,
          requestPayerEmail: true,
        })
        return pr.canMakePayment()
      })
      .then(result => {
        if (!active) return
        const next: WalletBrand = result?.applePay
          ? 'applePay'
          : result?.googlePay
            ? 'googlePay'
            : null
        cached = next
        setBrand(next)
      })
      .catch(() => {
        // Detection is an enhancement; the plain button still works.
        cached = null
      })

    return () => { active = false }
  }, [amount])

  return brand
}
