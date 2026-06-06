import { Star, Shield } from 'lucide-react'

interface Props {
  reviewCount: number
  averageRating: number
  salesCount: number
}

export default function ShopHero({ reviewCount, averageRating, salesCount }: Props) {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: '#1a1040' }}>
      {/* Cover image area */}
      <div
        className="h-40 sm:h-56 w-full flex items-center justify-center relative"
        style={{
          background: 'linear-gradient(135deg, #1a1040 0%, #2d1b6b 40%, #1a1040 100%)',
        }}
      >
        {/* decorative stars */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #c9a84c 1px, transparent 1px), radial-gradient(circle at 80% 20%, #c9a84c 1px, transparent 1px), radial-gradient(circle at 60% 80%, #c9a84c 1px, transparent 1px)',
          backgroundSize: '60px 60px, 80px 80px, 40px 40px',
        }} />
        <p className="text-white/40 text-sm italic">TheThirteenCoven</p>
      </div>

      {/* Shop info bar */}
      <div style={{ backgroundColor: '#f5f0e8' }} className="px-4 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Shop icon (positioned to overlap) */}
          <div
            className="-mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white flex items-center justify-center shrink-0 shadow-lg"
            style={{ backgroundColor: '#2d1b6b' }}
          >
            <span className="text-3xl sm:text-4xl">🔮</span>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
              TheThirteenCoven
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b6670' }}>
              Authentic spell casting, readings &amp; spiritual rituals
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm" style={{ color: '#6b6670' }}>
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-500 text-yellow-500" />
                <strong className="text-gray-800">{averageRating.toFixed(1)}</strong>
                &nbsp;({reviewCount.toLocaleString()} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Shield size={14} style={{ color: '#c9a84c' }} />
                {salesCount.toLocaleString()}+ sales
              </span>
              <span className="hidden sm:inline">🌙 Practitioner since 2018</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
