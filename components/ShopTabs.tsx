'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ProductGrid from './ProductGrid'
import ReviewsList from './ReviewsList'
import CommunityFeed from './CommunityFeed'
import type { Product } from '@/lib/products'
import type { Review } from '@/lib/reviews'
import type { CommunityPost } from '@/lib/community'
import type { Article } from '@/lib/articles'
import type { SocialLinks } from '@/lib/social'

export interface AboutContent {
  heading: string
  body: string
  commitments: string
  contactEmail: string
}

interface Props {
  activeTab: string
  category?: string
  query?: string
  reviews: Review[]
  reviewCount: number
  averageRating: number
  communityPosts: CommunityPost[]
  communityArticles: Article[]
  socialLinks: SocialLinks
  aboutContent?: AboutContent
}

const ABOUT_DEFAULTS = {
  heading: 'About ThirteenCoven',
  body: `Welcome to ThirteenCoven — a sanctuary of authentic spiritual services rooted in ancient traditions. I am a dedicated practitioner with over six years of experience in spell casting, energy work, and intuitive readings.

My practice draws from multiple spiritual lineages including Hoodoo, Wicca, Tantra, and West African spiritual traditions. Every ritual I perform is done with intention, care, and respect for the spiritual forces I work with.

Whether you are seeking to heal a broken relationship, attract abundance, protect yourself from negative energy, or simply gain clarity through a reading — I am here to guide you on your spiritual journey.`,
  commitments: `100% confidential & discreet service
Personalized rituals tailored to your situation
Ritual photo & report delivered to your email
Follow-up support included
Fast response within 24 hours`,
  contactEmail: 'hello@thirteencoven.com',
}

export default function ShopTabs({ activeTab, category, query, reviews, reviewCount, averageRating, communityPosts, communityArticles, socialLinks, aboutContent }: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(query ?? '')
  const [reloadKey, setReloadKey] = useState(0)

  const tab = activeTab

  // The request this render is showing results for. Storing the key alongside
  // the data lets `loading` be derived rather than tracked in its own state,
  // which also makes a stale response impossible to display.
  const requestKey = `${category ?? ''}|${query ?? ''}|${reloadKey}`
  const [result, setResult] = useState<{
    key: string
    products: Product[]
    categories: string[]
    saleEndDate: string | null
    saleDiscount: number | null
    error: string
  } | null>(null)

  useEffect(() => {
    if (tab !== 'items') return
    // Abort the previous request so a slower earlier search can't overwrite the
    // results of a newer one when the shopper changes category or query quickly.
    const controller = new AbortController()

    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (query) params.set('q', query)

    fetch(`/api/products?${params.toString()}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error('Request failed')
        return r.json()
      })
      .then(data => {
        setResult({
          key: requestKey,
          products: data.products ?? [],
          categories: data.categories ?? [],
          saleEndDate: data.saleEndDate ?? null,
          saleDiscount: data.saleDiscount ?? null,
          error: '',
        })
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Without this the spinner would spin forever on any network hiccup.
        setResult({
          key: requestKey,
          products: [],
          categories: [],
          saleEndDate: null,
          saleDiscount: null,
          error: 'We could not load the shop right now.',
        })
      })

    return () => controller.abort()
  }, [tab, category, query, requestKey])

  const loading = result?.key !== requestKey
  const loadError = result?.key === requestKey ? result.error : ''
  const products = result?.key === requestKey ? result.products : []
  const categories = result?.categories ?? []
  const saleEndDate = result?.key === requestKey ? result.saleEndDate : null
  const saleDiscount = result?.key === requestKey ? result.saleDiscount : null

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
          { key: 'community', label: 'Community' },
          { key: 'about', label: 'About' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key === 'reviews') {
                document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })
              } else {
                setTab(t.key)
              }
            }}
            className="flex-1 px-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-200 text-center whitespace-nowrap"
            style={{
              borderBottomColor: tab === t.key ? '#1a1040' : 'transparent',
              color: tab === t.key ? '#1a1040' : '#4b5563',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <div className="animate-fade-in">
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

            {/* Category filter dropdown. The native arrow sits flush against the
                right edge, where the pill's curve clips it — so draw our own
                inside the padding instead. */}
            <label htmlFor="category-filter" className="sr-only">Filter by category</label>
            <div className="relative">
              <select
                id="category-filter"
                value={category ?? ''}
                onChange={e => setCategory(e.target.value || undefined)}
                className="w-full appearance-none pl-4 pr-10 py-2 rounded-full text-xs font-medium border outline-none cursor-pointer"
                style={{ borderColor: '#1a1040', color: '#1a1040', backgroundColor: 'white' }}
              >
                <option value="">All categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: '#1a1040' }}
                aria-hidden="true"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16" style={{ color: '#4b5563' }} role="status">Loading…</div>
          ) : loadError ? (
            <div className="text-center py-16" role="alert">
              <p className="text-sm mb-4" style={{ color: '#4b5563' }}>{loadError}</p>
              <button
                onClick={() => setReloadKey(k => k + 1)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: '#1a1040' }}
              >
                Try again
              </button>
            </div>
          ) : (
            <ProductGrid products={products} saleEndDate={saleEndDate} saleDiscount={saleDiscount} />
          )}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <ReviewsList reviews={reviews} averageRating={averageRating} totalCount={reviewCount} />
      )}

      {/* Community tab */}
      {tab === 'community' && (
        <CommunityFeed posts={communityPosts} articles={communityArticles} socialLinks={socialLinks} />
      )}

      {/* About tab */}
      {tab === 'about' && (() => {
        const about = {
          heading: aboutContent?.heading || ABOUT_DEFAULTS.heading,
          body: aboutContent?.body || ABOUT_DEFAULTS.body,
          commitments: aboutContent?.commitments || ABOUT_DEFAULTS.commitments,
          contactEmail: aboutContent?.contactEmail || ABOUT_DEFAULTS.contactEmail,
        }
        const paragraphs = about.body.split(/\n\s*\n/).filter(Boolean)
        const commitmentLines = about.commitments.split('\n').filter(Boolean)

        return (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
                {about.heading}
              </h2>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
                  {p.trim()}
                </p>
              ))}
            </div>

            {commitmentLines.length > 0 && (
              <div className="rounded-xl p-5" style={{ backgroundColor: '#2d1b6b', color: 'white' }}>
                <h3 className="font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>🌙 My Commitment to You</h3>
                <ul className="text-sm space-y-1 opacity-90">
                  {commitmentLines.map((line, i) => (
                    <li key={i}>✦ {line.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {about.contactEmail && (
              <div>
                <h3 className="font-semibold mb-2" style={{ color: '#1a1040' }}>Have a question?</h3>
                <a
                  href={`mailto:${about.contactEmail}`}
                  className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#c9a84c' }}
                >
                  Contact the seller
                </a>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
