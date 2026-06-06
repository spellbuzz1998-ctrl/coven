'use client'
import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist'

interface Props {
  productSlug: string
  productTitle: string
  productPrice: number
  productImage: string
  onAuthRequired: () => void
  size?: number
}

export default function WatchlistButton({ productSlug, productTitle, productPrice, productImage, onAuthRequired, size = 20 }: Props) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setSaved(false); return }
    isInWatchlist(productSlug).then(setSaved)
  }, [user, productSlug])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { onAuthRequired(); return }
    setLoading(true)
    try {
      if (saved) {
        await removeFromWatchlist(productSlug)
        setSaved(false)
      } else {
        await addToWatchlist({ product_slug: productSlug, product_title: productTitle, product_price: productPrice, product_image: productImage })
        setSaved(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center justify-center rounded-full w-9 h-9 transition-all"
      style={{ backgroundColor: saved ? '#fdf2f8' : 'rgba(255,255,255,0.9)' }}
      title={saved ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Heart
        size={size}
        className="transition-all"
        style={{ color: saved ? '#e91e8c' : '#6b6670', fill: saved ? '#e91e8c' : 'none' }}
      />
    </button>
  )
}
