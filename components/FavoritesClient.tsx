'use client'
import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist'
import type { WatchlistItem } from '@/lib/watchlist'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Trash2 } from 'lucide-react'

export default function FavoritesClient() {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!user) { setFetching(false); return }
    getWatchlist().then(data => { setItems(data); setFetching(false) })
  }, [user])

  async function handleRemove(slug: string) {
    await removeFromWatchlist(slug)
    setItems(prev => prev.filter(i => i.product_slug !== slug))
  }

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Heart size={48} className="mx-auto mb-4" style={{ color: '#e91e8c' }} />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>Your favorites</h1>
        <p className="text-sm mb-6" style={{ color: '#6b6670' }}>Sign in to see your saved items.</p>
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-3 rounded-full font-bold text-white text-sm"
          style={{ backgroundColor: '#1a1040' }}
        >
          Sign in
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} onSuccess={() => setShowModal(false)} />}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Heart size={48} className="mx-auto mb-4" style={{ color: '#e5e7eb' }} />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>No favorites yet</h1>
        <p className="text-sm mb-6" style={{ color: '#6b6670' }}>Tap the ♡ on any product to save it here.</p>
        <Link href="/" className="px-8 py-3 rounded-full font-bold text-white text-sm" style={{ backgroundColor: '#1a1040' }}>
          Browse shop
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        My favorites ({items.length})
      </h1>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Link href={`/product/${item.product_slug}`} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
              <Image src={item.product_image || '/images/placeholder.jpg'} alt={item.product_title} fill className="object-cover" sizes="64px" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.product_slug}`}>
                <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: '#1a1040' }}>{item.product_title}</p>
              </Link>
              <p className="text-sm font-bold mt-1" style={{ color: '#1a1040' }}>${item.product_price.toFixed(2)}</p>
            </div>
            <button onClick={() => handleRemove(item.product_slug)} className="shrink-0 p-2 text-gray-400 hover:text-red-500">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
