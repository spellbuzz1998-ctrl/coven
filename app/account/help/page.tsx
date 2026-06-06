'use client'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, Package } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <ArrowLeft size={18} style={{ color: '#1a1040' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#1a1040' }}>Help & Support</h1>
      </div>

      {/* Info text */}
      <p className="text-sm mb-6 leading-relaxed" style={{ color: '#1a1040' }}>
        Messaging the seller with a help request is the fastest way to resolve most order issues.
      </p>

      {/* No orders card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed mb-8" style={{ borderColor: '#e5e7eb' }}>
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Package size={36} style={{ color: '#6b6670' }} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: '#1a1040' }}>No orders yet!</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6670' }}>Orders you make will show up here in case you need help.</p>
        </div>
      </div>

      {/* Need more help */}
      <div>
        <p className="font-bold text-sm mb-3" style={{ color: '#1a1040' }}>Need help with something else?</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          <Link href="mailto:support@thirteencoven.com" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <HelpCircle size={20} style={{ color: '#1a1040' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1a1040' }}>Contact support</p>
                <p className="text-xs" style={{ color: '#6b6670' }}>Email us directly</p>
              </div>
            </div>
            <span style={{ color: '#6b6670' }}>›</span>
          </Link>
          <Link href="/" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Package size={20} style={{ color: '#1a1040' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1a1040' }}>Browse shop</p>
                <p className="text-xs" style={{ color: '#6b6670' }}>Find answers about our services</p>
              </div>
            </div>
            <span style={{ color: '#6b6670' }}>›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
