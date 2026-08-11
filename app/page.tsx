import Link from 'next/link'
import { getAllReviews, getShopStats } from '@/lib/reviews'
import { getTotalSales } from '@/lib/orders'
import { getShopSetting } from '@/lib/db'
import { getSocialLinks } from '@/lib/social'
import { getCommunityPosts } from '@/lib/community'
import { getPublishedArticles } from '@/lib/articles'
import ShopHero from '@/components/ShopHero'
import ShopTabs from '@/components/ShopTabs'
import VideoTestimonials from '@/components/VideoTestimonials'

interface SearchParams {
  tab?: string
  category?: string
  q?: string
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const tab = sp.tab ?? 'items'
  const category = sp.category
  const query = sp.q

  const [stats, reviews, sales] = await Promise.all([
    getShopStats(),
    getAllReviews(50),
    getTotalSales(),
  ])
  const bannerUrl = getShopSetting('shop_banner_url')
  const avatarUrl = getShopSetting('shop_avatar_url')
  const shopName = getShopSetting('shop_name')
  const shopTagline = getShopSetting('shop_tagline')
  const shopBadge = getShopSetting('shop_badge')
  const socialLinks = getSocialLinks()
  const communityPosts = getCommunityPosts()
  const communityArticles = getPublishedArticles(6)
  const aboutContent = {
    heading: getShopSetting('about_heading') || '',
    body: getShopSetting('about_body') || '',
    commitments: getShopSetting('about_commitments') || '',
    contactEmail: getShopSetting('about_contact_email') || '',
  }

  return (
    <div>
      <ShopHero
        reviewCount={stats.reviewCount}
        averageRating={stats.averageRating}
        salesCount={sales + 847}
        bannerUrl={bannerUrl}
        avatarUrl={avatarUrl}
        socialLinks={socialLinks}
        shopName={shopName ?? undefined}
        shopTagline={shopTagline ?? undefined}
        shopBadge={shopBadge ?? undefined}
      />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <ShopTabs
          activeTab={tab}
          category={category}
          query={query}
          reviews={reviews}
          reviewCount={stats.reviewCount}
          averageRating={stats.averageRating}
          communityPosts={communityPosts}
          communityArticles={communityArticles}
          socialLinks={socialLinks}
          aboutContent={aboutContent}
        />
        <VideoTestimonials reviews={reviews} />
      </div>

      {/* Shop Policies footer */}
      <div className="border-t mt-4 pb-24" style={{ borderColor: '#e5e7eb', backgroundColor: '#f5f0e8' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Left: title */}
            <div className="sm:w-48 shrink-0">
              <p className="font-bold text-sm" style={{ color: '#1a1040' }}>Shop policies</p>
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>Last updated June 2025</p>
            </div>

            {/* Right: content */}
            <div className="flex-1 space-y-5">
              {/* Payment methods */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#6b6670' }}>Accepted payment methods</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['💳 Visa', '💳 Mastercard', '🅿️ PayPal', '🍎 Apple Pay', '🔵 Google Pay'].map(m => (
                    <span key={m} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ backgroundColor: 'white', color: '#1a1040', border: '1px solid #d1d5db' }}>
                      {m}
                    </span>
                  ))}
                </div>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Secure checkout powered by Stripe</p>
              </div>

              <div className="border-t" style={{ borderColor: '#e5e7eb' }} />

              {/* Returns */}
              <div className="flex gap-4">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#1a1040' }}>Returns & exchanges</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b6670' }}>
                    As all services are digital and performed upon order, we do not offer refunds once the ritual has been started. Please review product details carefully before purchasing. For concerns, message the seller within 48 hours.
                  </p>
                </div>
              </div>

              <div className="border-t" style={{ borderColor: '#e5e7eb' }} />

              {/* Privacy */}
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1a1040' }}>Privacy</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6b6670' }}>
                  All personal information shared for rituals is kept strictly confidential and never shared with third parties.
                </p>
              </div>

              <div className="border-t" style={{ borderColor: '#e5e7eb' }} />

              {/* Legal links */}
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {[
                  { href: '/terms', label: 'Terms & Conditions' },
                  { href: '/disclaimer', label: 'Disclaimer' },
                  { href: '/refund-policy', label: 'Refund Policy' },
                  { href: '/privacy-policy', label: 'Privacy Policy' },
                ].map(l => (
                  <Link key={l.href} href={l.href} className="text-xs hover:underline" style={{ color: '#6b6670' }}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
