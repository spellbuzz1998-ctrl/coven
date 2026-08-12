'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { CloudDownload, ChevronDown, ChevronUp, ShoppingCart, Heart, ChevronLeft, ChevronRight, X, Share2 } from 'lucide-react'
import { useCart, useCartCount } from '@/lib/cart'
import type { Product } from '@/lib/products'
import type { Review } from '@/lib/reviews'
import ReviewsList from './ReviewsList'
import ProductCard from './ProductCard'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/track'
import { useWalletBrand, type WalletBrand } from '@/lib/wallet'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist'

interface Props {
  product: Product
  reviews: Review[]
  shopStats: { reviewCount: number; averageRating: number }
  relatedProducts: Product[]
  saleEndDate?: string
  saleDiscount?: number
}

const TESTIMONIAL_CARD_W = 'clamp(200px, 65vw, 280px)'

function AppleMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.02-2.23 1.82-3.3 1.9-3.35-1.04-1.52-2.65-1.73-3.22-1.75-1.37-.14-2.67.81-3.36.81-.69 0-1.76-.79-2.9-.77-1.49.02-2.87.87-3.64 2.2-1.55 2.69-.4 6.67 1.11 8.85.74 1.07 1.62 2.27 2.78 2.23 1.11-.05 1.53-.72 2.88-.72 1.34 0 1.72.72 2.9.7 1.2-.02 1.96-1.09 2.69-2.17.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.34-.9-2.36-3.56zM14.9 5.2c.61-.74 1.02-1.77.91-2.8-.88.04-1.94.59-2.57 1.33-.56.65-1.06 1.7-.93 2.7.98.08 1.98-.5 2.59-1.23z" />
    </svg>
  )
}

function GoogleMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v2.98h3.86c2.26-2.09 3.57-5.17 3.57-8.8z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.31a7.2 7.2 0 0 1 0-4.6V6.62H1.28a12 12 0 0 0 0 10.78l3.99-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}

// Etsy-style express label: shows the wallet the visitor can actually use, and
// falls back to the plain wording when no wallet is available.
function BuyLabel({ brand, fallback, compact = false }: { brand: WalletBrand; fallback: string; compact?: boolean }) {
  if (brand === 'applePay') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        Buy with<AppleMark size={compact ? 16 : 15} />Pay
      </span>
    )
  }
  if (brand === 'googlePay') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        Buy with<GoogleMark size={compact ? 16 : 15} />Pay
      </span>
    )
  }
  return <>{fallback}</>
}

// Static copy — defined once at module scope instead of rebuilt on every render.
const PRODUCT_INFO_SECTIONS = [
  {
    title: 'Delivery & processing time',
    body: 'This is a digital service. After payment your ritual will be performed within 24–48 hours and a detailed report with photos emailed to you. Results typically begin within 3–21 days.',
  },
  {
    title: 'Returns & refund policy',
    body: 'Due to the nature of spiritual services, all sales are final. However, if you have any concerns please reach out and I will work with you to address them.',
  },
]

function AccordionRow({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid #e5e7eb' }}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-3 text-left">
        <span className="text-sm font-semibold" style={{ color: '#1a1040' }}>{title}</span>
        {open ? <ChevronUp size={14} style={{ color: '#9ca3af' }} /> : <ChevronDown size={14} style={{ color: '#9ca3af' }} />}
      </button>
      {open && <p className="pb-3 leading-relaxed whitespace-pre-wrap" style={{ color: '#374151', fontSize: '13px' }}>{body}</p>}
    </div>
  )
}

function ItemDetailsCard({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false)
  const previewLen = 120
  const needsTruncate = description.length > previewLen
  const previewText = needsTruncate ? description.slice(0, previewLen).replace(/\s+\S*$/, '') + '…' : description

  return (
    <div style={{ borderTop: '1px solid #e5e7eb' }} className="py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: '#1a1040' }}>Item details</span>
        {expanded && (
          <button onClick={() => setExpanded(false)} className="text-xs font-semibold" style={{ color: '#6b6670' }}>
            <ChevronUp size={14} style={{ color: '#9ca3af' }} />
          </button>
        )}
      </div>

      {/* Description */}
      <div className="leading-relaxed whitespace-pre-wrap" style={{ color: '#374151', fontSize: '13px' }}>
        {expanded ? description : previewText}
      </div>

      {/* Toggle button */}
      <div className="mt-3 flex justify-center">
        {expanded ? (
          <button
            onClick={() => setExpanded(false)}
            className="text-sm font-semibold py-2 px-6"
            style={{ color: '#1a1040' }}
          >
            Less
          </button>
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="text-sm font-semibold py-2 px-6"
            style={{ color: '#1a1040' }}
          >
            Learn more about this item
          </button>
        )}
      </div>
    </div>
  )
}

function SaleCountdown({ endDate }: { endDate: string }) {
  // Sale runs through the end of the given calendar day
  const target = new Date(endDate)
  target.setHours(23, 59, 59, 999)
  const targetMs = target.getTime()

  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, targetMs - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  if (remaining <= 0) return null

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <p className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: '#16a34a' }}>
      <span>Sale ends in</span>
      <span className="tabular-nums">
        {days > 0 && `${days}d `}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </p>
  )
}

export default function ProductDetailClient({ product, reviews, shopStats, relatedProducts, saleEndDate, saleDiscount }: Props) {
  const [personalization, setPersonalization] = useState('')
  const [added, setAdded] = useState(false)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null)
  const addItem = useCart(s => s.addItem)
  const router = useRouter()

  const hasVariants = ( product.variants ?? []).length > 0
  const selectedVariant = selectedVariantIdx !== null ? (product.variants ?? [])[selectedVariantIdx] : null
  const basePrice = selectedVariant ? selectedVariant.price : product.price

  // Shop-wide sale: if discount % is set, calculate sale price from the single product price
  const activeOriginalPrice = saleDiscount ? basePrice : (selectedVariant ? selectedVariant.originalPrice : product.originalPrice)
  const activePrice = saleDiscount ? parseFloat((basePrice * (1 - saleDiscount / 100)).toFixed(2)) : basePrice

  const discount: number | null = saleDiscount ?? (activeOriginalPrice
    ? Math.round((1 - activePrice / activeOriginalPrice) * 100)
    : null)

  const images = product.images.length > 0 ? product.images : ['/images/placeholder.jpg']

  // A product that offers variants must have one chosen — otherwise the buyer
  // could add it at the base price and the server would reject the checkout.
  const needsVariant = hasVariants && selectedVariantIdx === null
  const [variantError, setVariantError] = useState(false)

  function buildCartItem() {
    const variantLabel = selectedVariant ? ` — ${selectedVariant.name}` : ''
    return {
      id: `${product.id}-v${selectedVariantIdx ?? 'default'}-${personalization.slice(0, 10)}`,
      productId: product.id,
      slug: product.slug,
      title: product.title + variantLabel,
      price: activePrice,
      listPrice: basePrice,
      image: images[0],
      personalization: personalization || undefined,
      variantIdx: selectedVariantIdx,
    }
  }

  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Clear any pending "✓ Added!" reset when the page unmounts.
  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current) }, [])

  function handleAddToCart() {
    if (needsVariant) { setVariantError(true); return }
    setVariantError(false)
    addItem(buildCartItem())
    track('add_to_cart', { productSlug: product.slug, productTitle: product.title, value: activePrice })
    setAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 2000)
  }

  // Reads the persisted cart in a hydration-safe way (0 on the server pass).
  const displayCartCount = useCartCount()
  // Which express-pay wallet this device can actually complete a payment with.
  const walletBrand = useWalletBrand(activePrice)
  const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up')
  useEffect(() => {
    track('product_view', { productSlug: product.slug, productTitle: product.title })
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 4) return
      setScrollDir(y > lastY ? 'down' : 'up')
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [product.slug, product.title])

  function handleBuyNow() {
    if (needsVariant) { setVariantError(true); return }
    setVariantError(false)
    addItem(buildCartItem())
    track('add_to_cart', { productSlug: product.slug, productTitle: product.title, value: activePrice })
    track('begin_checkout', { value: activePrice })
    router.push('/checkout')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-xs mb-4 flex gap-1" style={{ color: '#6b6670' }}>
        <Link href="/" className="hover:underline">Shop</Link>
        <span>/</span>
        <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:underline">{product.category}</Link>
        <span>/</span>
        <span className="truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
        {/* Image gallery — swipeable with dots + video as 2nd slide */}
        <div>
          <SwipeGallery images={images} videoId={product.video} productSlug={product.slug} productTitle={product.title} productPrice={activePrice} />
        </div>

        {/* Product info — white background, Etsy layout */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
          <div className="pt-5 px-5 pb-0">


            {/* 1. Sale ends — pulled from shop-wide sale in admin Sales tab */}
            {saleEndDate && saleDiscount && <SaleCountdown endDate={saleEndDate} />}

            {/* 2. Price + strikethrough + % off — all on one line, BEFORE title */}
            <div className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold" style={{ color: '#1a1040' }}>
                ${activePrice.toFixed(2)}
              </span>
              {activeOriginalPrice && (
                <span className="text-lg line-through" style={{ color: '#9ca3af' }}>
                  ${activeOriginalPrice.toFixed(2)}
                </span>
              )}
              {discount && (
                <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                  ({discount}% off)
                </span>
              )}
            </div>

            {/* 3. Title */}
            <h1 className="text-base font-bold leading-snug mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
              {product.title}
            </h1>

            {/* 5. Stats row — 3 columns */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="rounded-xl py-3 px-2 text-center" style={{ backgroundColor: '#f5f0e8' }}>
                <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Est. delivery</p>
                <p className="text-xs font-bold" style={{ color: '#1a1040' }}>24–48 hrs</p>
              </div>
              <div className="rounded-xl py-3 px-2 text-center" style={{ backgroundColor: '#f5f0e8' }}>
                <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Shipping</p>
                <p className="text-xs font-bold" style={{ color: '#1a1040' }}>Free</p>
              </div>
              <button
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl py-3 px-2 text-center transition-opacity hover:opacity-75 active:opacity-60"
                style={{ backgroundColor: '#f5f0e8' }}
              >
                <p className="text-xs mb-0.5" style={{ color: '#9ca3af' }}>Ratings ({shopStats.reviewCount})</p>
                <p className="text-xs font-bold" style={{ color: '#1a1040' }}>⭐ {shopStats.averageRating.toFixed(1)} →</p>
              </button>
            </div>
          </div>


          <div className="p-5 pt-4">
            {/* 7. Variants — full width row style */}
            {hasVariants && (
              <div className="mb-3">
                <label htmlFor="variant-select" className="sr-only">Choose an option</label>
                <div className="rounded-xl overflow-hidden relative" style={{ border: `1px solid ${variantError ? '#dc2626' : '#d1d5db'}` }}>
                  <select
                    id="variant-select"
                    value={selectedVariantIdx ?? ''}
                    aria-invalid={variantError}
                    onChange={e => {
                      const v = e.target.value
                      setSelectedVariantIdx(v === '' ? null : Number(v))
                      setVariantError(false)
                    }}
                    className="w-full outline-none cursor-pointer appearance-none px-4 py-3.5 text-sm font-bold"
                    style={{ color: '#1a1040', backgroundColor: 'white' }}
                  >
                    <option value="">Select an option</option>
                    {(product.variants ?? []).map((v, i) => (
                      <option key={v.name || i} value={i}>
                        {v.name} — ${v.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} aria-hidden="true" />
                </div>
                {variantError && (
                  <p className="text-xs mt-1.5" style={{ color: '#dc2626' }} role="alert">
                    Please choose an option before adding to cart.
                  </p>
                )}
              </div>
            )}


            {/* 9. Personalization */}
            {product.personalizationPrompt && (
              <div className="mb-4">
                <p className="text-xs mb-2 italic" style={{ color: '#6b7280' }}>{product.personalizationPrompt}</p>
                <textarea
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ backgroundColor: 'white', color: '#1a1040', border: '1px solid #d1d5db' }}
                  placeholder="Enter your details here..."
                  value={personalization}
                  onChange={e => setPersonalization(e.target.value)}
                  maxLength={500}
                />
              </div>
            )}

            {/* 10. Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 btn-press"
                style={{ backgroundColor: 'white', color: '#1a1040', border: '2px solid #1a1040' }}
              >
                <ShoppingCart size={16} />
                {added ? '✓ Added!' : 'Add to cart'}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 rounded-full font-bold text-sm btn-press flex items-center justify-center"
                style={{ backgroundColor: '#1a1040', color: 'white' }}
              >
                <BuyLabel brand={walletBrand} fallback="Buy it now" />
              </button>
            </div>

            {/* Digital badge */}
            {product.isDigital && (
              <div className="flex items-center gap-1.5 mb-4 text-xs justify-center" style={{ color: '#9ca3af' }}>
                <CloudDownload size={13} />
                <span>Digital service — delivered to your email</span>
              </div>
            )}

            {/* Item details + accordions */}
            <div>
              <ItemDetailsCard description={product.description} />
              {PRODUCT_INFO_SECTIONS.map(({ title, body }) => (
                <AccordionRow key={title} title={title} body={body} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase protection */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-5 py-4">
        {/* Static heading — this was a <button> with an empty click handler, which
            announced itself to screen readers and keyboards as an interactive control. */}
        <p className="text-sm font-bold" style={{ color: '#1a1040' }}>Did you know?</p>
        <div className="flex items-start gap-3 mt-3">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0 mt-0.5">
            <circle cx="18" cy="18" r="18" fill="#f3f0ff"/>
            <path d="M18 9l-7 3v6c0 4.1 2.98 7.93 7 9 4.02-1.07 7-4.9 7-9v-6l-7-3z" fill="#7c3aed" opacity=".2"/>
            <path d="M18 9l-7 3v6c0 4.1 2.98 7.93 7 9 4.02-1.07 7-4.9 7-9v-6l-7-3z" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
            <path d="M15 18l2 2 4-4" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: '#1a1040' }}>ThirteenCoven Buyer Protection</p>
            <p className="text-xs leading-relaxed" style={{ color: '#6b6670' }}>
              Shop confidently knowing that if something goes wrong with your order, we&apos;ve got your back. Every purchase is protected by our satisfaction commitment —{' '}
              <a href="/refund-policy" className="underline" style={{ color: '#1a1040' }}>see our refund policy</a>.
            </p>
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

      {/* Per-product client testimonials */}
      <div id="reviews">
        <ProductTestimonialsStrip productId={product.id} />
      </div>

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

      {/* Floating bottom bar — switches based on scroll direction (mobile only) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        {/* Cart bar — shown when scrolling down */}
        <div
          className="flex items-center justify-center gap-3 rounded-full px-3 py-2 shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            opacity: scrollDir === 'down' ? 1 : 0,
            pointerEvents: scrollDir === 'down' ? 'auto' : 'none',
            transform: scrollDir === 'down' ? 'translateY(0)' : 'translateY(8px)',
            position: scrollDir === 'up' ? 'absolute' : 'relative',
          }}
        >
          <button
            onClick={handleAddToCart}
            className="shrink-0 px-5 py-2.5 rounded-full font-bold transition-all border-2"
            style={{ backgroundColor: 'white', color: '#1a1040', borderColor: '#1a1040', fontSize: 13 }}
          >
            {added ? '✓ Added!' : 'Add to cart'}
          </button>
          <button
            onClick={handleBuyNow}
            // min-width keeps the wallet variant the same size as "Add to cart" —
            // " Pay" is far shorter text and would otherwise look shrunken.
            className="shrink-0 min-w-[125px] px-5 py-2.5 rounded-full font-bold text-white transition-all flex items-center justify-center border-2"
            style={{ backgroundColor: '#1a1040', borderColor: '#1a1040', fontSize: 13 }}
          >
            <BuyLabel brand={walletBrand} fallback="Buy now" compact />
          </button>
        </div>

        {/* Home nav — shown when scrolling up */}
        <nav
          className="flex items-center justify-around rounded-full px-3 py-1.5 transition-all duration-300"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            opacity: scrollDir === 'up' ? 1 : 0,
            pointerEvents: scrollDir === 'up' ? 'auto' : 'none',
            transform: scrollDir === 'up' ? 'translateY(0)' : 'translateY(8px)',
            position: scrollDir === 'down' ? 'absolute' : 'relative',
          }}
        >
          {[
            { href: '/', icon: <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" /></svg>, label: 'Home' },
            { href: '/favorites', icon: <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, label: 'Favorites' },
            { href: '/account', icon: <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, label: 'You' },
            { href: '/cart', icon: <span className="relative inline-block"><svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>{displayCartCount > 0 && <span className="absolute -top-1.5 -right-2 text-white font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4760a', fontSize: 9, width: 16, height: 16 }}>{displayCartCount}</span>}</span>, label: 'Cart' },
            { href: '/account/messages', icon: <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, label: 'Messages' },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full" style={{ color: '#6b6670' }}>
              <span>{icon}</span>
              <span className="font-medium" style={{ fontSize: 10 }}>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ─── Swipeable Image Gallery ──────────────────────────────────────────────
function SwipeGallery({ images, videoId, productSlug, productTitle, productPrice }: { images: string[], videoId?: string, productSlug: string, productTitle: string, productPrice: number }) {
  const { user } = useAuth()
  const [favSaved, setFavSaved] = useState(false)
  const [favBusy, setFavBusy] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  // Signed-out visitors always see the empty heart, so it resets on sign-out
  // without a setState inside the effect below.
  const isFavSaved = !!user && favSaved

  useEffect(() => {
    if (!user) return
    let active = true
    isInWatchlist(productSlug)
      .then(result => { if (active) setFavSaved(result) })
      .catch(() => {
        // Favourite state is cosmetic — leave the heart unfilled on failure.
      })
    return () => { active = false }
  }, [user, productSlug])

  async function toggleFav() {
    if (!user) { setShowAuth(true); return }
    if (favBusy) return
    setFavBusy(true)
    const next = !isFavSaved
    setFavSaved(next)
    try {
      if (next) {
        await addToWatchlist({
          product_slug: productSlug,
          product_title: productTitle,
          product_price: productPrice,
          product_image: images[0] || '/images/placeholder.jpg',
        })
        track('favorite', { productSlug, productTitle, value: productPrice })
      } else {
        await removeFromWatchlist(productSlug)
      }
    } catch {
      setFavSaved(!next)
    } finally {
      setFavBusy(false)
    }
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: productTitle, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
      }).catch(() => {})
    }
  }

  // Build slides: image[0], video (if any), image[1..n]
  type Slide = { type: 'image'; src: string } | { type: 'video'; id: string }
  const slides: Slide[] = []
  if (images[0]) slides.push({ type: 'image', src: images[0] })
  if (videoId)   slides.push({ type: 'video', id: videoId })
  for (let i = 1; i < images.length; i++) slides.push({ type: 'image', src: images[i] })

  const [current, setCurrent] = useState(0)
  const startXRef = useRef<number | null>(null)
  const total = slides.length

  function go(idx: number) {
    setCurrent(Math.max(0, Math.min(total - 1, idx)))
  }

  function onTouchStart(e: React.TouchEvent) { startXRef.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (startXRef.current === null) return
    const diff = startXRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) go(current + (diff > 0 ? 1 : -1))
    startXRef.current = null
  }
  function onMouseDown(e: React.MouseEvent) { startXRef.current = e.clientX }
  function onMouseUp(e: React.MouseEvent) {
    if (startXRef.current === null) return
    const diff = startXRef.current - e.clientX
    if (Math.abs(diff) > 40) go(current + (diff > 0 ? 1 : -1))
    startXRef.current = null
  }

  const isVideoSlide = slides[current]?.type === 'video'

  return (
    <div className="select-none">
      {/* Main swipe area */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-black"
        style={{ cursor: isVideoSlide ? 'default' : 'grab' }}
        onTouchStart={isVideoSlide ? undefined : onTouchStart}
        onTouchEnd={isVideoSlide ? undefined : onTouchEnd}
        onMouseDown={isVideoSlide ? undefined : onMouseDown}
        onMouseUp={isVideoSlide ? undefined : onMouseUp}
      >
        {/* Slides track */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ width: `${total * 100}%`, transform: `translateX(-${current * (100 / total)}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="relative h-full shrink-0" style={{ width: `${100 / total}%` }}>
              {slide.type === 'image' ? (
                <Image
                  src={slide.src}
                  alt={i === 0 ? productTitle : `${productTitle} — photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={i === 0}
                  draggable={false}
                />
              ) : (
                <div className="relative w-full h-full overflow-hidden">
                  <iframe
                    title={`${productTitle} — video`}
                    src={`https://www.youtube.com/embed/${slide.id}?autoplay=${current === i ? 1 : 0}&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3&disablekb=1`}
                    style={{
                      position: 'absolute',
                      top: '-72px',
                      left: 0,
                      width: '100%',
                      height: 'calc(100% + 132px)',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Arrows */}
        {total > 1 && current > 0 && (
          <button onClick={() => go(current - 1)} aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <ChevronLeft size={18} style={{ color: '#1a1040' }} aria-hidden="true" />
          </button>
        )}
        {total > 1 && current < total - 1 && (
          <button onClick={() => go(current + 1)} aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
            <ChevronRight size={18} style={{ color: '#1a1040' }} aria-hidden="true" />
          </button>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {slides.map((slide, i) => (
              <button key={i} onClick={() => go(i)} className="rounded-full transition-all"
                aria-label={`Go to ${slide.type === 'video' ? 'video' : `image ${i + 1}`}`}
                aria-current={i === current}
                style={{
                  width: i === current ? 20 : 6, height: 6,
                  backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.5)',
                }} />
            ))}
          </div>
        )}

        {/* Favorite + Share buttons */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button
            onClick={toggleFav}
            aria-pressed={isFavSaved}
            aria-label={isFavSaved ? 'Remove from favorites' : 'Save to favorites'}
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: isFavSaved ? 'rgba(253,242,248,0.95)' : 'rgba(255,255,255,0.85)' }}
            title={isFavSaved ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart
              size={16}
              aria-hidden="true"
              style={{ color: isFavSaved ? '#e91e8c' : '#1a1040', fill: isFavSaved ? '#e91e8c' : 'none', transition: 'all 0.2s' }}
            />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share this product"
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
            title="Share this product"
          >
            <Share2 size={14} style={{ color: '#1a1040' }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button key={i} onClick={() => go(i)}
              aria-label={`Show ${slide.type === 'video' ? 'video' : `image ${i + 1}`}`}
              aria-current={i === current}
              className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all flex items-center justify-center"
              style={{ borderColor: i === current ? '#c9a84c' : 'transparent', opacity: i === current ? 1 : 0.65, backgroundColor: '#111' }}>
              {slide.type === 'image' ? (
                <Image src={slide.src} alt="" fill className="object-cover" sizes="56px" draggable={false} />
              ) : (
                <span className="text-white text-lg" aria-hidden="true">▶</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  )
}

// ─── Per-Product Client Testimonials Strip ────────────────────────────────
interface ProdTestimonial {
  id: string
  type?: 'video' | 'text' | 'image'
  name: string
  result: string
  initials: string
  thumbnailColor: string
  videoUrl: string
  imageUrl?: string
  rating?: number
  date?: string
}

function timeAgoStrip(dateStr?: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

function ProductTestimonialsStrip({ productId }: { productId: string }) {
  const [items, setItems] = useState<ProdTestimonial[]>([])
  const [active, setActive] = useState<ProdTestimonial | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/products/${productId}/testimonials`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((data: ProdTestimonial[]) => {
        if (Array.isArray(data)) setItems(data)
      })
      .catch(() => {
        // Testimonials are supplementary — the strip simply stays hidden.
      })
    return () => controller.abort()
  }, [productId])

  if (items.length === 0) return null

  function ytId(url: string) {
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/)
    return m ? m[1] : null
  }

  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Verified buyer
      </h2>
      <p className="text-xs mb-4" style={{ color: '#6b6670' }}>Real results from real clients</p>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {items.map(t => {
          const isText = t.type === 'text'
          const isImage = t.type === 'image'
          const vid = (!isText && !isImage) ? ytId(t.videoUrl) : null
          const initials = t.initials || t.name.slice(0, 2).toUpperCase()
          const rating = t.rating ?? 5

          if (isImage) {
            // ── Image testimonial card ──
            return (
              <div key={t.id}
                className="shrink-0 rounded-2xl overflow-hidden flex flex-col"
                style={{ width: TESTIMONIAL_CARD_W, minHeight: 280, backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              >
                {t.imageUrl ? (
                  <div className="flex-1 relative">
                    <Image
                      src={t.imageUrl}
                      alt={`Review screenshot from ${t.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 65vw, 280px"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                    <span className="text-4xl" aria-hidden="true">🖼</span>
                  </div>
                )}
                <div className="px-3 pb-3 pt-2">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} width={13} height={13} viewBox="0 0 24 24" fill={n <= rating ? '#111' : '#e5e7eb'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  {t.result && <p className="text-xs leading-snug line-clamp-2 mb-1" style={{ color: '#1a1040' }}>&ldquo;{t.result}&rdquo;</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: '#f3f4f6', color: '#1a1040' }}>
                      {initials.charAt(0)}
                    </div>
                    <p className="text-xs font-bold" style={{ color: '#1a1040' }}>{t.name}</p>
                    {t.date && <p className="text-xs ml-auto" style={{ color: '#9ca3af' }}>{timeAgoStrip(t.date)}</p>}
                  </div>
                </div>
              </div>
            )
          }

          if (isText) {
            // ── Text review card (Etsy style) ──
            return (
              <div key={t.id}
                className="shrink-0 rounded-2xl border flex flex-col p-4 bg-white"
                style={{ width: TESTIMONIAL_CARD_W, minHeight: 220, borderColor: '#e5e7eb' }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width={16} height={16} viewBox="0 0 24 24" fill={n <= rating ? '#111' : '#e5e7eb'}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm leading-relaxed flex-1 line-clamp-5" style={{ color: '#1a1040' }}>
                  {t.result}
                </p>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: '#f3f4f6' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#f3f4f6', color: '#1a1040' }}>
                    {initials.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#1a1040' }}>{initials.charAt(0)}</p>
                    <p className="text-xs" style={{ color: '#1a1040' }}>{timeAgoStrip(t.date)}</p>
                  </div>
                </div>
              </div>
            )
          }

          // ── Video card ──
          return (
            <button key={t.id}
              onClick={() => t.videoUrl ? setActive(t) : undefined}
              className="relative rounded-2xl overflow-hidden shrink-0 flex flex-col text-left"
              style={{ width: TESTIMONIAL_CARD_W, minHeight: 300, backgroundColor: t.thumbnailColor }}
            >
              {vid ? (
                <Image src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt=""
                  fill sizes="(max-width: 640px) 65vw, 280px"
                  className="object-cover opacity-60" />
              ) : (
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #c9a84c 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              )}
              <div className="relative flex-1 flex items-center justify-center">
                {t.videoUrl && (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-10"
                    style={{ backgroundColor: '#c9a84c' }}>
                    <svg width={20} height={20} fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                )}
              </div>
              <div className="relative px-3 pb-3 pt-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {initials}
                </div>
                <div className="min-w-0">
                <p className="text-white font-semibold text-xs">{t.name}</p>
                {t.result && (
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    &ldquo;{t.result}&rdquo;
                  </p>
                )}
                {t.date && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{timeAgoStrip(t.date)}</p>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActive(null)}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: '100%', maxWidth: 340, backgroundColor: '#000' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setActive(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}>
              <X size={16} />
            </button>
            <div className="relative" style={{ aspectRatio: '9/16' }}>
              {active.videoUrl.includes('youtube') || active.videoUrl.includes('youtu.be') ? (
                <>
                  <iframe src={`https://www.youtube.com/embed/${ytId(active.videoUrl)}?autoplay=1&fs=0&modestbranding=1&rel=0`}
                    title={`Video testimonial from ${active.name}`}
                    className="w-full h-full" allow="autoplay" />
                  <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none" style={{ backgroundColor: '#000' }} />
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ backgroundColor: '#000' }} />
                </>
              ) : (
                <video src={active.videoUrl} controls autoPlay className="w-full h-full object-cover" />
              )}
            </div>
            <div className="px-4 py-3" style={{ backgroundColor: '#1a1040' }}>
              <p className="text-white text-sm font-semibold">{active.name}</p>
              {active.result && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>&ldquo;{active.result}&rdquo;</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
