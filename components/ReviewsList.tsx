import { Star } from 'lucide-react'
import type { Review } from '@/lib/reviews'

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 fill-gray-300'}
        />
      ))}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

interface Props {
  reviews: Review[]
  averageRating?: number
  totalCount?: number
}

export default function ReviewsList({ reviews, averageRating, totalCount }: Props) {
  const avg = averageRating ?? (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1))
  const count = totalCount ?? reviews.length

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
        <div className="text-5xl font-bold" style={{ color: '#1a1040', fontFamily: 'Georgia, serif' }}>
          {avg.toFixed(1)}
        </div>
        <div>
          <div className="flex gap-1 mb-1">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={16} className={n <= Math.round(avg) ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-200 text-gray-200'} />
            ))}
          </div>
          <p className="text-sm" style={{ color: '#6b6670' }}>{count.toLocaleString()} reviews</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {reviews.map(r => (
          <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: '#2d1b6b' }}
              >
                {r.reviewerName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{r.reviewerName}</span>
                  <StarRow rating={r.rating} />
                  <span className="text-xs" style={{ color: '#6b6670' }}>{timeAgo(r.createdAt)}</span>
                </div>

                {r.purchasedItem && (
                  <p className="text-xs mt-0.5 mb-1" style={{ color: '#6b6670' }}>
                    Purchased: {r.purchasedItem}
                  </p>
                )}

                <p className="text-sm mt-1 leading-relaxed" style={{ color: '#374151' }}>{r.body}</p>

                {r.sellerResponse && (
                  <div className="mt-3 pl-3 border-l-2 border-yellow-400">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#c9a84c' }}>Response from TheThirteenCoven</p>
                    <p className="text-sm" style={{ color: '#374151' }}>{r.sellerResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
