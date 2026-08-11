import { Star, Shield } from 'lucide-react'
import Image from 'next/image'
import SocialIcons from '@/components/SocialIcons'
import type { SocialLinks } from '@/lib/social'

interface Props {
  reviewCount: number
  averageRating: number
  salesCount: number
  bannerUrl?: string | null
  avatarUrl?: string | null
  socialLinks?: SocialLinks
  shopName?: string
  shopTagline?: string
  shopBadge?: string
}

export default function ShopHero({ reviewCount, averageRating, salesCount, bannerUrl, avatarUrl, socialLinks = [], shopName, shopTagline, shopBadge }: Props) {
  const name = shopName || 'TheThirteenCoven'
  const tagline = shopTagline || 'Authentic spell casting, readings & spiritual rituals'
  const badge = shopBadge || 'Practitioner since 2018'
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: '#1a1040' }}>
      {/* Cover image area */}
      <div
        className="h-40 sm:h-56 w-full flex items-center justify-center relative"
        style={{
          background: bannerUrl ? undefined : 'linear-gradient(135deg, #1a1040 0%, #2d1b6b 40%, #1a1040 100%)',
        }}
      >
        {bannerUrl ? (
          <Image src={bannerUrl} alt="Shop banner" fill className="object-cover" sizes="100vw" priority />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, #c9a84c 1px, transparent 1px), radial-gradient(circle at 80% 20%, #c9a84c 1px, transparent 1px), radial-gradient(circle at 60% 80%, #c9a84c 1px, transparent 1px)',
              backgroundSize: '60px 60px, 80px 80px, 40px 40px',
            }} />
            <p className="text-white/40 text-sm italic">{name}</p>
          </>
        )}
      </div>

      {/* Shop info bar */}
      <div style={{ backgroundColor: '#f5f0e8' }} className="px-4 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Avatar */}
          <div
            className="-mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white flex items-center justify-center shrink-0 shadow-lg overflow-hidden animate-scale-in"
            style={{ backgroundColor: '#2d1b6b' }}
          >
            {avatarUrl
              ? <Image src={avatarUrl} alt="Shop avatar" width={96} height={96} className="w-full h-full object-cover" />
              : <span className="text-3xl sm:text-4xl">🔮</span>
            }
          </div>

          <div className="flex-1 animate-fade-in-up">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
              {name}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
              {tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm" style={{ color: '#4b5563' }}>
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-500 text-yellow-500" />
                <strong className="text-gray-800">{averageRating.toFixed(1)}</strong>
                &nbsp;({reviewCount.toLocaleString()} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Shield size={14} style={{ color: '#c9a84c' }} />
                {salesCount.toLocaleString()}+ people helped
              </span>
              <span className="hidden sm:inline">🌙 {badge}</span>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-semibold" style={{ color: '#4b5563' }}>Follow along:</span>
                <SocialIcons links={socialLinks} size={18} className="text-[#1a1040]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
