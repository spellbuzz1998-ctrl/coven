'use client'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'
import Link from 'next/link'
import { ShoppingBag, Star, Gift, MapPin, MessageCircle, Bell, User, HelpCircle, ChevronRight, LogOut, X, Mail } from 'lucide-react'

export default function AccountClient() {
  const { user, loading, signOut } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showConfirmBanner, setShowConfirmBanner] = useState(false)

  function handleAuthSuccess(reason?: string) {
    setShowModal(false)
    if (reason === 'confirm') setShowConfirmBanner(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-400">Loading...</div></div>
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-32">
        {/* Confirm email banner */}
        {showConfirmBanner && (
          <div className="flex items-start gap-3 p-4 rounded-2xl mb-6 relative" style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d' }}>
            <Mail size={20} style={{ color: '#d4760a' }} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: '#1a1040' }}>Check your email</p>
              <p className="text-xs mt-0.5" style={{ color: '#6b6670' }}>We sent a confirmation link. Click it to activate your account, then sign in.</p>
            </div>
            <button onClick={() => setShowConfirmBanner(false)} className="shrink-0 text-gray-400">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f5f0e8' }}>
            <User size={36} style={{ color: '#1a1040' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>Your account</h1>
          <p className="text-sm mb-8" style={{ color: '#6b6670' }}>Sign in to save favorites, track orders, and more.</p>
          <button onClick={() => setShowModal(true)} className="w-full py-3.5 rounded-full font-bold text-white text-sm mb-3" style={{ backgroundColor: '#1a1040' }}>
            Sign in
          </button>
          <button onClick={() => setShowModal(true)} className="w-full py-3.5 rounded-full font-bold text-sm border-2" style={{ borderColor: '#1a1040', color: '#1a1040' }}>
            Register
          </button>
        </div>

        {showModal && <AuthModal onClose={() => setShowModal(false)} onSuccess={handleAuthSuccess} />}
      </div>
    )
  }

  const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'Customer'
  const initials = firstName.slice(0, 1).toUpperCase()

  // Calculate how long they've been a member
  const joinDate = new Date(user.created_at)
  const now = new Date()
  const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
  const years = Math.floor(months / 12)
  const memberSince = years >= 1 ? `${years} year${years > 1 ? 's' : ''} as a member` : `${months || 1} month${months !== 1 ? 's' : ''} as a member`

  const gridItems = [
    { href: '/account/purchases', icon: ShoppingBag, label: 'Purchases' },
    { href: '/?tab=reviews', icon: Star, label: 'Reviews' },
    { href: '/favorites', icon: Gift, label: 'Favorites' },
    { href: '/account/profile', icon: MapPin, label: 'Manage profile' },
  ]

  const listItems = [
    { href: '/account/messages', icon: MessageCircle, label: 'Messages', dot: false },
    { href: '/account/updates', icon: Bell, label: 'Updates', dot: false },
    { href: '/account/profile', icon: User, label: 'Profile', dot: false },
    { href: '/account/help', icon: HelpCircle, label: 'Help & Support', dot: false },
  ]

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-32">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0" style={{ backgroundColor: '#1a1040' }}>
          {initials}
        </div>
        <div>
          <p className="font-bold text-xl" style={{ color: '#1a1040' }}>{firstName}</p>
          <p className="text-sm" style={{ color: '#6b6670' }}>{memberSince}</p>
        </div>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {gridItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <Icon size={26} style={{ color: '#1a1040' }} />
            <p className="font-semibold text-sm" style={{ color: '#1a1040' }}>{label}</p>
          </Link>
        ))}
      </div>

      {/* List items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {listItems.map(({ href, icon: Icon, label, dot }) => (
          <Link key={label} href={href} className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Icon size={20} style={{ color: '#1a1040' }} />
              <span className="font-medium text-sm" style={{ color: '#1a1040' }}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {dot && <span className="w-2 h-2 rounded-full bg-red-500" />}
              <ChevronRight size={16} style={{ color: '#6b6670' }} />
            </div>
          </Link>
        ))}
        <button onClick={signOut} className="flex items-center gap-3 px-4 py-4 w-full text-left">
          <LogOut size={20} style={{ color: '#6b6670' }} />
          <span className="font-medium text-sm" style={{ color: '#6b6670' }}>Sign out</span>
        </button>
      </div>
    </div>
  )
}
