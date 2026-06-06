'use client'
import { useEffect } from 'react'
import { useCart } from '@/lib/cart'
import Link from 'next/link'
import { CheckCircle, Star } from 'lucide-react'

export default function OrderConfirmClient() {
  const clearCart = useCart(s => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
      <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Thank you for your order! 🌙
      </h1>
      <p className="text-base mb-6" style={{ color: '#374151' }}>
        Your payment was received and your ritual is now being prepared with full intention and care.
      </p>

      <div className="rounded-xl p-6 mb-8 text-left" style={{ backgroundColor: '#2d1b6b', color: 'white' }}>
        <h2 className="font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>What happens next</h2>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-2"><span className="shrink-0">1.</span> You will receive a confirmation email shortly</li>
          <li className="flex gap-2"><span className="shrink-0">2.</span> Your ritual will be performed within 24–48 hours</li>
          <li className="flex gap-2"><span className="shrink-0">3.</span> A detailed report with photos will be emailed to you</li>
          <li className="flex gap-2"><span className="shrink-0">4.</span> Results typically begin within 3–21 days</li>
          <li className="flex gap-2"><span className="shrink-0">5.</span> A follow-up check-in is included — watch your email</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-full font-semibold text-white"
          style={{ backgroundColor: '#1a1040' }}
        >
          Continue shopping
        </Link>
        <a
          href="mailto:hello@thirteencoven.com"
          className="px-6 py-3 rounded-full font-semibold border-2"
          style={{ borderColor: '#1a1040', color: '#1a1040' }}
        >
          Contact seller
        </a>
      </div>
    </div>
  )
}
