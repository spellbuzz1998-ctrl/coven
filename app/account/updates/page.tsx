'use client'
import Link from 'next/link'
import { ArrowLeft, Bell } from 'lucide-react'

export default function UpdatesPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <ArrowLeft size={18} style={{ color: '#1a1040' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#1a1040' }}>Updates</h1>
      </div>

      {/* Empty state */}
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f5f0e8' }}>
          <Bell size={36} style={{ color: '#c9a84c' }} />
        </div>
        <p className="font-bold text-lg mb-2" style={{ color: '#1a1040' }}>No updates yet</p>
        <p className="text-sm" style={{ color: '#6b6670' }}>
          Updates about your orders and new products will appear here.
        </p>
      </div>
    </div>
  )
}
