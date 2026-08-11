'use client'
import { Star } from 'lucide-react'
import type { Review } from '@/lib/reviews'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

function recentFiveStarCount(reviews: Review[]) {
  const weekAgo = Date.now() - 7 * 86400000
  return reviews.filter(r => r.rating === 5 && new Date(r.createdAt).getTime() > weekAgo).length
}

interface Props {
  reviews: Review[]
  averageRating?: number
  totalCount?: number
}

export default function ReviewsList({ reviews, averageRating, totalCount }: Props) {
  const avg = averageRating ?? (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1))
  const count = totalCount ?? reviews.length
  const recentFive = recentFiveStarCount(reviews)

  return (
    <div>
      {/* Etsy-style badge */}
      {recentFive >= 2 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ backgroundColor: '#e8eaf6' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#3f51b5' }}>
            <Star size={16} fill="white" color="white" />
          </div>
          <p className="text-sm font-medium" style={{ color: '#1a237e' }}>
            Multiple <strong>5-star reviews</strong> this week.
          </p>
        </div>
      )}

      {/* Section header */}
      <p className="text-base font-bold mb-4" style={{ color: '#1a1040' }}>
        Item reviews ({count.toLocaleString()})
      </p>

      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {reviews.map((r, i) => (
          <div key={r.id}
            className={`shrink-0 rounded-2xl border p-5 flex flex-col hover-lift animate-slide-in-right stagger-${Math.min(i + 1, 8)}`}
            style={{
              width: 'calc(80vw - 16px)',
              maxWidth: 320,
              minHeight: 180,
              borderColor: '#e5e7eb',
              backgroundColor: 'white',
            }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={18}
                  className={n <= r.rating ? 'fill-gray-900 text-gray-900' : 'fill-gray-200 text-gray-200'} />
              ))}
            </div>

            {/* Review text */}
            <p className="text-sm leading-relaxed flex-1 line-clamp-4" style={{ color: '#1a1040' }}>
              {r.body}
            </p>

            {r.purchasedItem && (
              <p className="text-xs mt-2 italic truncate" style={{ color: '#9ca3af' }}>
                {r.purchasedItem}
              </p>
            )}

            {/* Footer: initial + date */}
            <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: '#f3f4f6' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: '#f3f4f6', color: '#1a1040' }}>
                {r.reviewerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: '#1a1040' }}>
                  {r.reviewerName.charAt(0).toUpperCase()}
                </p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{timeAgo(r.createdAt)}</p>
              </div>
            </div>

            {r.sellerResponse && (
              <div className="mt-3 pl-3 border-l-2 border-yellow-400">
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#c9a84c' }}>Response from TheThirteenCoven</p>
                <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{r.sellerResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Average rating summary below cards */}
      <div className="flex items-center gap-2 mt-5 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
        <span className="text-2xl font-bold" style={{ color: '#1a1040', fontFamily: 'Georgia, serif' }}>{avg.toFixed(1)}</span>
        <div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={14}
                className={n <= Math.round(avg) ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-200 text-gray-200'} />
            ))}
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{count.toLocaleString()} reviews</p>
        </div>
      </div>
    </div>
  )
}
