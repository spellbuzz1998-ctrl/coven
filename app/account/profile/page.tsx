'use client'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { ArrowLeft, Share } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Customer'
  const initials = firstName.slice(0, 1).toUpperCase()

  return (
    <div className="max-w-md mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/account" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <ArrowLeft size={18} style={{ color: '#1a1040' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: '#1a1040' }}>{firstName}</h1>
        <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
          <Share size={16} style={{ color: '#1a1040' }} />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-4 pb-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4" style={{ backgroundColor: '#1a1040' }}>
          {initials}
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1040' }}>{firstName}</h2>
        <p className="text-sm mb-4" style={{ color: '#6b6670' }}>
          Welcome to ThirteenCoven — a place of magic, healing, and spiritual growth.
        </p>

        {/* Stats */}
        <div className="flex gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <span className="font-bold text-sm" style={{ color: '#1a1040' }}>0</span>
            <span className="text-sm ml-1" style={{ color: '#6b6670' }}>Following</span>
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: '#1a1040' }}>0</span>
            <span className="text-sm ml-1" style={{ color: '#6b6670' }}>Followers</span>
          </div>
        </div>

        {/* Account info */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm" style={{ color: '#1a1040' }}>Account details</h3>
          <div className="p-4 rounded-2xl border border-gray-100 bg-white">
            <p className="text-xs mb-1" style={{ color: '#6b6670' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: '#1a1040' }}>{user?.email}</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-white">
            <p className="text-xs mb-1" style={{ color: '#6b6670' }}>Member since</p>
            <p className="text-sm font-medium" style={{ color: '#1a1040' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
