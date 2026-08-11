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
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [removing, setRemoving] = useState<string | null>(null)

  // Keeping the request key with the data lets `fetching` be derived instead of
  // set at the top of the effect, and drops any response for a stale request.
  const requestKey = `${user?.id ?? ''}|${reloadKey}`
  const [result, setResult] = useState<{ key: string; items: WatchlistItem[] } | null>(null)
  const items = result?.key === requestKey ? result.items : []
  const setItems = (next: WatchlistItem[]) => setResult({ key: requestKey, items: next })

  useEffect(() => {
    if (!user) return
    let active = true
    getWatchlist()
      .then(data => {
        if (!active) return
        setResult({ key: requestKey, items: data })
      })
      .catch(() => {
        // Without this the page would sit on "Loading…" forever.
        if (!active) return
        setResult({ key: requestKey, items: [] })
        setError('We could not load your favorites right now.')
      })
    return () => { active = false }
  }, [user, requestKey])

  const fetching = result?.key !== requestKey

  async function handleRemove(slug: string) {
    if (removing) return
    setRemoving(slug)
    const previous = items
    // Optimistic removal, rolled back if the delete fails.
    setItems(items.filter(i => i.product_slug !== slug))
    try {
      const { error: removeError } = await removeFromWatchlist(slug)
      if (removeError) throw removeError
    } catch {
      setItems(previous)
      setError('That item could not be removed. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  // Only signed-in visitors wait on the watchlist request.
  if (loading || (user && fetching)) {
    return <div className="flex items-center justify-center min-h-[60vh]" style={{ color: '#4b5563' }} role="status">Loading…</div>
  }

  if (user && error && items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center" role="alert">
        <Heart size={48} className="mx-auto mb-4" style={{ color: '#e5e7eb' }} aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>Couldn&apos;t load favorites</h1>
        <p className="text-sm mb-6" style={{ color: '#4b5563' }}>{error}</p>
        <button
          onClick={() => setReloadKey(k => k + 1)}
          className="px-8 py-3 rounded-full font-bold text-white text-sm"
          style={{ backgroundColor: '#1a1040' }}
        >
          Try again
        </button>
      </div>
    )
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
      {error && (
        <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ color: '#b91c1c', backgroundColor: '#fef2f2' }} role="alert">{error}</p>
      )}
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
            <button
              onClick={() => handleRemove(item.product_slug)}
              disabled={removing === item.product_slug}
              aria-label={`Remove ${item.product_title} from favorites`}
              className="shrink-0 p-2 text-gray-400 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
