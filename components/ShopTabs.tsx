'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import ProductGrid from './ProductGrid'
import ReviewsList from './ReviewsList'
import type { Product } from '@/lib/products'
import type { Review } from '@/lib/reviews'

interface Props {
  activeTab: string
  category?: string
  query?: string
  reviews: Review[]
  reviewCount: number
  averageRating: number
}

// Client component that fetches products via URL param changes
import { useEffect } from 'react'

export default function ShopTabs({ activeTab, category, query, reviews, reviewCount, averageRating }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(query ?? '')

  const tab = activeTab

  useEffect(() => {
    if (tab !== 'items') return
    setLoading(true)
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (query) params.set('q', query)
    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? [])
        setCategories(data.categories ?? [])
        setLoading(false)
      })
  }, [tab, category, query])

  function setTab(t: string) {
    const params = new URLSearchParams()
    params.set('tab', t)
    if (category) params.set('category', category)
    router.push(`/?${params.toString()}`)
  }

  function setCategory(cat?: string) {
    const params = new URLSearchParams()
    params.set('tab', 'items')
    if (cat) params.set('category', cat)
    router.push(`/?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('tab', 'items')
    if (searchInput.trim()) params.set('q', searchInput.trim())
    router.push(`/?${params.toString()}`)
  }

  return (
    <div>
      {/* Tab nav */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'items', label: 'Items' },
          { key: 'reviews', label: `Reviews (${reviewCount})` },
          { key: 'about', label: 'About' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-3 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderBottomColor: tab === t.key ? '#1a1040' : 'transparent',
              color: tab === t.key ? '#1a1040' : '#6b6670',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <div>
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex flex-1 max-w-sm rounded-lg overflow-hidden border border-gray-300">
              <input
                type="text"
                placeholder="Search this shop"
                className="flex-1 px-3 py-2 text-sm outline-none bg-white"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button type="submit" className="px-3 py-2 text-white text-sm" style={{ backgroundColor: '#1a1040' }}>
                Go
              </button>
            </form>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategory(undefined)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: !category ? '#1a1040' : 'white',
                  color: !category ? 'white' : '#1a1040',
                  borderColor: '#1a1040',
                }}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  style={{
                    backgroundColor: category === cat ? '#1a1040' : 'white',
                    color: category === cat ? 'white' : '#1a1040',
                    borderColor: '#1a1040',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ color: '#6b6670' }}>Loading...</div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <ReviewsList reviews={reviews} averageRating={averageRating} totalCount={reviewCount} />
      )}

      {/* About tab */}
      {tab === 'about' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
              About TheThirteenCoven
            </h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
              Welcome to TheThirteenCoven — a sanctuary of authentic spiritual services rooted in ancient traditions. I am a dedicated practitioner with over six years of experience in spell casting, energy work, and intuitive readings.
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
              My practice draws from multiple spiritual lineages including Hoodoo, Wicca, Tantra, and West African spiritual traditions. Every ritual I perform is done with intention, care, and respect for the spiritual forces I work with.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
              Whether you are seeking to heal a broken relationship, attract abundance, protect yourself from negative energy, or simply gain clarity through a reading — I am here to guide you on your spiritual journey.
            </p>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: '#2d1b6b', color: 'white' }}>
            <h3 className="font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>🌙 My Commitment to You</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>✦ 100% confidential &amp; discreet service</li>
              <li>✦ Personalized rituals tailored to your situation</li>
              <li>✦ Ritual photo &amp; report delivered to your email</li>
              <li>✦ Follow-up support included</li>
              <li>✦ Fast response within 24 hours</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2" style={{ color: '#1a1040' }}>Have a question?</h3>
            <a
              href="mailto:hello@thirteencoven.com"
              className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: '#c9a84c' }}
            >
              Contact the seller
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
