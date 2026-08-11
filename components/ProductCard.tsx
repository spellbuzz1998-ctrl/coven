'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Star, CloudDownload, Heart } from 'lucide-react'
import type { Product } from '@/lib/products'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist'
import { track } from '@/lib/track'

interface Props {
  product: Product
  saleEndDate?: string | null
  saleDiscount?: number | null
}

export default function ProductCard({ product, saleEndDate, saleDiscount }: Props) {
  const salePrice = saleDiscount ? parseFloat((product.price * (1 - saleDiscount / 100)).toFixed(2)) : null
  const displayPrice = salePrice ?? product.price
  const displayOriginal = saleDiscount ? product.price : product.originalPrice
  const discount = saleDiscount ?? (product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null)

  const image = product.images[0] || '/images/placeholder.jpg'

  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const isSaved = !!user && saved

  useEffect(() => {
    if (!user) return
    let active = true
    isInWatchlist(product.slug)
      .then(result => { if (active) setSaved(result) })
      .catch(() => {
        // Favourite state is cosmetic — leave the heart unfilled on failure.
      })
    return () => { active = false }
  }, [user, product.slug])

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { setShowAuth(true); return }
    if (busy) return
    setBusy(true)
    const next = !saved
    setSaved(next)
    try {
      if (next) {
        await addToWatchlist({
          product_slug: product.slug,
          product_title: product.title,
          product_price: displayPrice,
          product_image: image,
        })
        track('favorite', { productSlug: product.slug, productTitle: product.title, value: displayPrice })
      } else {
        await removeFromWatchlist(product.slug)
      }
    } catch {
      // Roll the heart back so it reflects what's actually saved.
      setSaved(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
    <Link href={`/product/${product.slug}`} className="group flex flex-col relative">
      {/* Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
        <Image
          src={image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount && (
          <div
            className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: '#d4760a' }}
          >
            {discount}% off
          </div>
        )}

        {/* Favorite heart — visible on hover or when saved.
            Signed-out visitors always see the empty state, so the heart resets
            on sign-out without needing a setState inside an effect. */}
        <button
          onClick={toggleFavorite}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove ${product.title} from favorites` : `Save ${product.title} to favorites`}
          className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm"
          style={{
            backgroundColor: isSaved ? '#fdf2f8' : 'rgba(255,255,255,0.9)',
            opacity: isSaved ? 1 : undefined,
          }}
          title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart
            size={18}
            className="transition-all"
            aria-hidden="true"
            style={{ color: isSaved ? '#e91e8c' : '#4b5563', fill: isSaved ? '#e91e8c' : 'none' }}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col">
        <p className="text-xs mb-1" style={{ color: '#6b6670' }}>TheThirteenCoven</p>
        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: '#1a1040' }}>
          {product.title}
        </p>

        {/* Stars placeholder */}
        <div className="flex items-center gap-0.5 mb-1">
          {[1,2,3,4,5].map(n => (
            <Star key={n} size={10} className="fill-yellow-500 text-yellow-500" />
          ))}
          <span className="text-xs ml-1" style={{ color: '#6b6670' }}>(5.0)</span>
        </div>

        {/* Sale end date */}
        {saleEndDate && saleDiscount && (
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#16a34a' }}>
            Sale ends on {new Date(saleEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-bold text-base" style={{ color: '#1a1040' }}>
            ${displayPrice.toFixed(2)}+
          </span>
          {displayOriginal && (
            <span className="text-xs line-through" style={{ color: '#6b6670' }}>
              ${displayOriginal.toFixed(2)}+
            </span>
          )}
        </div>

        {/* Digital badge */}
        {product.isDigital && (
          <div className="flex items-center gap-1 mt-1" style={{ color: '#6b6670' }}>
            <CloudDownload size={11} />
            <span className="text-xs">Digital download</span>
          </div>
        )}
      </div>
    </Link>
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  )
}
