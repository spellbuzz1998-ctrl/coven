'use client'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { ArrowLeft, Bell, ShoppingBag } from 'lucide-react'

export default function PurchasesPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <ArrowLeft size={18} style={{ color: '#1a1040' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#1a1040' }}>Purchases</h1>
      </div>

      {/* Missing purchase banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ backgroundColor: '#c9a84c20', border: '1px solid #c9a84c40' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#c9a84c' }}>
          <Bell size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: '#1a1040' }}>Missing a purchase?</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b6670' }}>Check your email to add your purchase to your account.</p>
        </div>
      </div>

      {/* Empty state */}
      {user && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f5f0e8' }}>
            <ShoppingBag size={36} style={{ color: '#c9a84c' }} />
          </div>
          <p className="font-bold text-lg mb-2" style={{ color: '#1a1040' }}>No purchases yet</p>
          <p className="text-sm mb-6" style={{ color: '#6b6670' }}>Your orders will appear here after checkout.</p>
          <Link href="/" className="px-8 py-3 rounded-full font-bold text-white text-sm" style={{ backgroundColor: '#1a1040' }}>
            Browse shop
          </Link>
        </div>
      )}
    </div>
  )
}
