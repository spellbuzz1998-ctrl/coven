'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'

export default function CartPageClient() {
  const { items, removeItem, updateQuantity, total, listSubtotal, saleDiscount, discountAmount, coupon: appliedCoupon, setCoupon: setAppliedCoupon } = useCart()
  const [coupon, setCoupon] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)

  const subtotal = total()
  const itemsTotal = listSubtotal()
  const sale = saleDiscount()
  const discount = discountAmount()
  const orderTotal = subtotal - discount

  async function applyCoupon() {
    const code = coupon.trim()
    // Guard against empty codes and against a second click while one is in flight.
    if (!code || couponBusy) return
    setCouponBusy(true)
    setCouponError('')
    try {
      const res = await fetch(`/api/coupon?code=${encodeURIComponent(code)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCouponError('Could not check that code. Please try again.')
      } else if (data.valid) {
        setAppliedCoupon({ code, discount: data.amount, type: data.type === 'fixed' ? 'fixed' : 'percentage' })
      } else if (data.reason === 'expired') {
        setCouponError('That code has expired.')
      } else if (data.reason === 'used_up') {
        setCouponError('That code has reached its usage limit.')
      } else {
        setCouponError('That coupon code is not valid.')
      }
    } catch {
      setCouponError('Could not check that code. Please check your connection.')
    } finally {
      setCouponBusy(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>Your cart is empty</h1>
        <p className="mb-6" style={{ color: '#6b6670' }}>Add some magical services to get started.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full font-semibold text-white"
          style={{ backgroundColor: '#1a1040' }}
        >
          Browse the shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Your cart ({items.length} item{items.length !== 1 ? 's' : ''})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <Image src={item.image || '/images/placeholder.jpg'} alt={item.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.slug}`} className="font-medium text-sm hover:underline line-clamp-2" style={{ color: '#1a1040' }}>
                  {item.title}
                </Link>
                {item.personalization && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6b6670' }}>
                    📝 {item.personalization}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {/* Quantity */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.listPrice && item.listPrice > item.price ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs line-through" style={{ color: '#9ca3af' }}>${(item.listPrice * item.quantity).toFixed(2)}</span>
                        <span className="font-bold text-sm text-green-600">${(item.price * item.quantity).toFixed(2)}</span>
                      </span>
                    ) : (
                      <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                    )}
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 h-fit">
          <h2 className="font-bold mb-4" style={{ color: '#1a1040' }}>Order summary</h2>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span style={{ color: '#6b6670' }}>Item(s) total</span>
              <span>${itemsTotal.toFixed(2)}</span>
            </div>
            {sale > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Shop sale discount</span>
                <span>-${sale.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: '#6b6670' }}>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base">
              <span>Estimated total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Klarna */}
          <p className="text-xs mb-4" style={{ color: '#6b6670' }}>
            Pay over time with <strong style={{ color: '#1a1040' }}>Klarna</strong>. ⓘ
          </p>

          {/* Coupon */}
          <div className="mb-4">
            <div className="flex gap-2">
              <label htmlFor="cart-coupon" className="sr-only">Coupon code</label>
              <input
                id="cart-coupon"
                type="text"
                placeholder="Coupon code"
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
                style={{ borderColor: couponError ? '#dc2626' : '#d1d5db' }}
                value={coupon}
                onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError('') }}
              />
              <button
                onClick={applyCoupon}
                disabled={couponBusy || !coupon.trim()}
                className="px-3 py-2 text-sm rounded-lg font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#c9a84c' }}
              >
                {couponBusy ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">{couponError}</p>}
            {appliedCoupon && !couponError && (
              <p className="text-xs mt-1 flex items-center gap-2" style={{ color: '#15803d' }}>
                ✓ {appliedCoupon.code} applied
                <button onClick={() => setAppliedCoupon(null)} className="underline" style={{ color: '#6b6670' }}>Remove</button>
              </p>
            )}
          </div>

          {/* Go to checkout */}
          <Link
            href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`}
            className="block w-full py-3 rounded-full font-bold text-center text-white"
            style={{ backgroundColor: '#1a1040' }}
          >
            Go to checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
