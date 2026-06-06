'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'

export default function CartPageClient() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')

  const subtotal = total()
  const discount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount / 100 * 100) / 100 : 0
  const orderTotal = subtotal - discount

  async function applyCoupon() {
    setCouponError('')
    const res = await fetch(`/api/coupon?code=${coupon}`)
    const data = await res.json()
    if (data.valid) {
      setAppliedCoupon({ code: coupon, discount: data.amount })
    } else {
      setCouponError('Invalid coupon code')
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
                <Image src={item.image} alt={item.title} fill className="object-cover" sizes="80px" />
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
                    <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
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
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between" style={{ color: '#d4760a' }}>
                <span>Coupon ({appliedCoupon?.code})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: '#6b6670' }}>Shipping</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                value={coupon}
                onChange={e => setCoupon(e.target.value.toUpperCase())}
              />
              <button
                onClick={applyCoupon}
                className="px-3 py-2 text-sm rounded-lg font-medium text-white"
                style={{ backgroundColor: '#c9a84c' }}
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            {appliedCoupon && <p className="text-xs text-green-600 mt-1">✓ Coupon applied! Try WELCOME10</p>}
          </div>

          <Link
            href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`}
            className="block w-full py-3 rounded-full font-bold text-center text-white"
            style={{ backgroundColor: '#1a1040' }}
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  )
}
