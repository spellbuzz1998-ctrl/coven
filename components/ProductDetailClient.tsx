'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Star, CloudDownload, ChevronDown, ChevronUp, ShoppingCart, Heart } from 'lucide-react'
import { useCart } from '@/lib/cart'
import type { Product } from '@/lib/products'
import type { Review } from '@/lib/reviews'
import ReviewsList from './ReviewsList'
import ProductCard from './ProductCard'
import VideoTestimonials from './VideoTestimonials'
import { useRouter } from 'next/navigation'

interface Props {
  product: Product
  reviews: Review[]
  shopStats: { reviewCount: number; averageRating: number }
  relatedProducts: Product[]
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-gray-200 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-sm" style={{ color: '#1a1040' }}>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="mt-3 text-sm leading-relaxed" style={{ color: '#374151' }}>{children}</div>}
    </div>
  )
}

export default function ProductDetailClient({ product, reviews, shopStats, relatedProducts }: Props) {
  const [activeImage, setActiveImage] = useState(0)
  const [personalization, setPersonalization] = useState('')
  const [added, setAdded] = useState(false)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(
    ( product.variants ?? []).length > 0 ? 0 : null
  )
  const addItem = useCart(s => s.addItem)
  const router = useRouter()

  const hasVariants = ( product.variants ?? []).length > 0
  const selectedVariant = selectedVariantIdx !== null ? (product.variants ?? [])[selectedVariantIdx] : null
  const activePrice = selectedVariant ? selectedVariant.price : product.price
  const activeOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice

  const discount = activeOriginalPrice
    ? Math.round((1 - activePrice / activeOriginalPrice) * 100)
    : null

  const images = product.images.length > 0 ? product.images : ['/images/placeholder.jpg']

  function buildCartItem() {
    const variantLabel = selectedVariant ? ` — ${selectedVariant.name}` : ''
    return {
      id: `${product.id}-v${selectedVariantIdx ?? 'default'}-${personalization.slice(0, 10)}`,
      productId: product.id,
      slug: product.slug,
      title: product.title + variantLabel,
      price: activePrice,
      image: images[0],
      personalization: personalization || undefined,
    }
  }

  function handleAddToCart() {
    addItem(buildCartItem())
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const cartCount = useCart(s => s.count())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const displayCartCount = mounted ? cartCount : 0

  function handleBuyNow() {
    addItem(buildCartItem())
    router.push('/checkout')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs mb-4 flex gap-1" style={{ color: '#6b6670' }}>
        <Link href="/" className="hover:underline">Shop</Link>
        <span>/</span>
        <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:underline">{product.category}</Link>
        <span>/</span>
        <span className="truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image gallery */}
        <div>
          {/* Main image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
            <Image
              src={images[activeImage]}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors"
                  style={{ borderColor: i === activeImage ? '#c9a84c' : 'transparent' }}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {/* Shop name */}
          <p className="text-sm mb-1" style={{ color: '#6b6670' }}>
            <Link href="/" className="hover:underline">TheThirteenCoven</Link>
          </p>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold mb-2 leading-snug" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            {product.title}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={14} className="fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <span className="text-sm" style={{ color: '#6b6670' }}>
              ({shopStats.reviewCount} shop reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-bold" style={{ color: '#1a1040' }}>
              ${activePrice.toFixed(2)}
            </span>
            {activeOriginalPrice && (
              <span className="text-lg line-through" style={{ color: '#6b6670' }}>
                ${activeOriginalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {discount && (
            <p className="text-sm font-semibold mb-3" style={{ color: '#d4760a' }}>
              {discount}% off · Limited time sale
            </p>
          )}

          {/* Variants */}
          {hasVariants && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1a1040' }}>Choose an option</label>
              <select
                value={selectedVariantIdx ?? 0}
                onChange={e => setSelectedVariantIdx(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none appearance-none cursor-pointer"
                style={{ color: '#1a1040', backgroundColor: 'white', borderColor: '#1a1040' }}
              >
                {(product.variants ?? []).map((v, i) => {
                  const vDiscount = v.originalPrice ? Math.round((1 - v.price / v.originalPrice) * 100) : null
                  return (
                    <option key={i} value={i}>
                      {v.name} — ${v.price.toFixed(2)}{vDiscount ? ` (${vDiscount}% off)` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Digital badge */}
          {product.isDigital && (
            <div className="flex items-center gap-1.5 mb-4 text-sm" style={{ color: '#6b6670' }}>
              <CloudDownload size={15} />
              <span>Digital download — delivered to your email</span>
            </div>
          )}

          {/* Personalization */}
          {product.personalizationPrompt && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1a1040' }}>
                Personalization <span className="font-normal text-xs">(required)</span>
              </label>
              <p className="text-xs mb-2 italic" style={{ color: '#6b6670' }}>
                {product.personalizationPrompt}
              </p>
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 resize-none bg-white"
                style={{ '--tw-ring-color': '#c9a84c' } as React.CSSProperties}
                placeholder="Enter your details here..."
                value={personalization}
                onChange={e => setPersonalization(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-right mt-0.5" style={{ color: '#6b6670' }}>{personalization.length}/500</p>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 rounded-full font-semibold text-white transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1a1040' }}
            >
              <ShoppingCart size={18} />
              {added ? 'Added!' : 'Add to cart'}
            </button>
            <button
              className="p-3 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
              aria-label="Save to favorites"
            >
              <Heart size={18} style={{ color: '#6b6670' }} />
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            className="w-full py-3 rounded-full font-semibold border-2 transition-colors"
            style={{ borderColor: '#1a1040', color: '#1a1040' }}
          >
            Buy it now
          </button>

          {/* Accordions */}
          <div className="mt-6">
            <Accordion title="Delivery & processing time">
              <p>This is a digital service delivered entirely online. After payment:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You will receive a confirmation email immediately</li>
                <li>Your ritual will be performed within 24–48 hours</li>
                <li>A detailed report with photos will be emailed to you</li>
                <li>Results typically begin within 3–21 days depending on the working</li>
              </ul>
            </Accordion>

            <Accordion title="Item details">
              <div className="whitespace-pre-wrap">{product.description}</div>
            </Accordion>

            <Accordion title="Returns & refund policy">
              <p>Due to the nature of spiritual services, all sales are final. However, I am committed to your satisfaction. If you have any concerns, please reach out and I will work with you to address them.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            Reviews for this item
          </h2>
          <ReviewsList reviews={reviews} />
        </div>
      )}

      {/* Meet the seller */}
      <div className="rounded-xl p-6 mb-12" style={{ backgroundColor: '#2d1b6b', color: 'white' }}>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Meet your seller</h2>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: '#1a1040' }}>
            🔮
          </div>
          <div>
            <p className="font-semibold text-lg">TheThirteenCoven</p>
            <p className="text-sm opacity-80 mt-1">
              {shopStats.reviewCount} reviews · {shopStats.averageRating.toFixed(1)} ⭐ average
            </p>
            <p className="text-sm opacity-80 mt-2">
              I am a dedicated spiritual practitioner with over 6 years of experience. I specialize in love spells, protection rituals, and intuitive readings. Every working is performed with full intention and care.
            </p>
            <a
              href="mailto:hello@thirteencoven.com"
              className="inline-block mt-3 px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#c9a84c', color: '#1a1040' }}
            >
              Message seller
            </a>
          </div>
        </div>
      </div>

      {/* Video Testimonials */}
      <VideoTestimonials />

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="pb-28">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            You may also like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Floating add-to-cart bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div
          className="flex items-center gap-3 rounded-full px-3 py-2 shadow-2xl"
          style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        >
          {/* Product thumbnail */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-100">
            <Image src={images[0]} alt={product.title} fill className="object-cover" sizes="40px" />
          </div>

          <div className="flex-1" />

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="shrink-0 px-4 py-2.5 rounded-full font-bold text-sm text-white transition-all border-2"
            style={{ backgroundColor: 'white', color: '#1a1040', borderColor: '#1a1040' }}
          >
            {added ? '✓ Added!' : 'Add to cart'}
          </button>

          {/* Buy now button */}
          <button
            onClick={handleBuyNow}
            className="shrink-0 px-4 py-2.5 rounded-full font-bold text-sm text-white transition-all"
            style={{ backgroundColor: '#1a1040' }}
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  )
}
