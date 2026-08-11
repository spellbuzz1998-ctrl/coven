'use client'
import { useState, useEffect } from 'react'
import { Play, X } from 'lucide-react'
import type { Review } from '@/lib/reviews'

interface VideoTestimonial {
  id: string
  name: string
  result: string
  thumbnailColor: string
  videoUrl: string
  initials: string
}

const DEFAULT_TESTIMONIALS: VideoTestimonial[] = [
  { id: '1', name: 'Sarah M.', result: 'He came back in 2 weeks', thumbnailColor: '#2d1b6b', videoUrl: '', initials: 'SM' },
  { id: '2', name: 'Destiny R.', result: 'He texted after 6 weeks silence', thumbnailColor: '#1a1040', videoUrl: '', initials: 'DR' },
  { id: '3', name: 'jasmine_l', result: 'Reading was 100% accurate', thumbnailColor: '#4a2080', videoUrl: '', initials: 'JL' },
]

function VideoCard({ t, onClick }: { t: VideoTestimonial; onClick: () => void }) {
  const playable = !!t.videoUrl
  return (
    <button
      onClick={onClick}
      // A card with no video attached isn't actionable — don't offer it to
      // keyboard or screen-reader users as a button that does nothing.
      disabled={!playable}
      aria-label={playable ? `Play video testimonial from ${t.name}` : `Testimonial from ${t.name}`}
      className="relative rounded-2xl overflow-hidden shrink-0 flex flex-col text-left disabled:cursor-default"
      style={{ width: 160, minHeight: 240, backgroundColor: t.thumbnailColor }}
    >
      <div className="flex-1 flex items-center justify-center relative w-full">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #c9a84c 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white z-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}
        >
          {t.initials}
        </div>
        {playable && (
          <div
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{ backgroundColor: '#c9a84c' }}
          >
            <Play size={16} fill="white" color="white" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="text-white font-semibold text-xs">{t.name}</p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
          &ldquo;{t.result}&rdquo;
        </p>
      </div>
    </button>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.reviewerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  return (
    <div
      className="rounded-2xl shrink-0 flex flex-col p-4 text-left"
      style={{ width: 200, minHeight: 240, backgroundColor: 'white', border: '1px solid #e5e7eb' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: '#2d1b6b' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: '#1a1040' }}>{review.reviewerName}</p>
          <p className="text-xs" style={{ color: '#c9a84c' }}>{stars}</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed flex-1" style={{ color: '#374151' }}>
        &ldquo;{review.body}&rdquo;
      </p>
      {review.purchasedItem && (
        <p className="text-xs mt-2 italic truncate" style={{ color: '#9ca3af' }}>
          {review.purchasedItem}
        </p>
      )}
    </div>
  )
}

interface Props {
  reviews?: Review[]
}

export default function VideoTestimonials({ reviews = [] }: Props) {
  const [testimonials, setTestimonials] = useState<VideoTestimonial[]>(DEFAULT_TESTIMONIALS)
  const [active, setActive] = useState<VideoTestimonial | null>(null)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/testimonials', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then((data: VideoTestimonial[] | null) => {
        if (Array.isArray(data) && data.length > 0) setTestimonials(data)
      })
      .catch(() => {
        // Falls back to the default cards already in state.
      })
    return () => controller.abort()
  }, [])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    // Guard against a second submit while the first is still in flight.
    if (subscribing || !email.trim()) return
    setSubscribing(true)
    setSubscribeError('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        // Previously this claimed success even when the request failed.
        const data = await res.json().catch(() => ({}))
        setSubscribeError(data.error === 'Invalid email'
          ? 'Please enter a valid email address.'
          : 'We could not sign you up just now. Please try again.')
      } else {
        setSubscribed(true)
        setEmail('')
      }
    } catch {
      setSubscribeError('We could not reach the server. Please check your connection.')
    }
    setSubscribing(false)
  }

  return (
    <div id="testimonials" className="mb-12 pt-6">
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Client video testimonials
      </h2>
      <p className="text-sm mb-4" style={{ color: '#6b6670' }}>Real results from real clients</p>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {testimonials.map(t => (
          <VideoCard key={t.id} t={t} onClick={() => t.videoUrl ? setActive(t) : null} />
        ))}

        {reviews.map(r => (
          <ReviewCard key={r.id} review={r} />
        ))}

        <div
          className="rounded-2xl shrink-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed"
          style={{ width: 160, minHeight: 240, borderColor: '#c9a84c' }}
        >
          <span className="text-3xl">📹</span>
          <p className="text-xs text-center px-3 font-medium" style={{ color: '#c9a84c' }}>
            Add your video testimonial here
          </p>
        </div>
      </div>

      <p className="text-xs mt-3 italic" style={{ color: '#6b6670' }}>
        ✦ All testimonials are from verified clients
      </p>

      {/* Newsletter signup */}
      <div className="mt-8 rounded-2xl p-6 text-center animate-fade-in-up" style={{ backgroundColor: '#2d1b6b' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#c9a84c' }}>✦ Free Newsletter</p>
        <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Sign up for free spiritual guidance
        </h3>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Moon rituals, love spells tips & exclusive offers — straight to your inbox.
        </p>
        {subscribed ? (
          <div className="py-3">
            <p className="text-sm font-semibold" style={{ color: '#e8c76a' }} role="status">✓ You&apos;re on the list! Check your inbox.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setSubscribeError('') }}
                className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}
              />
              <button
                type="submit"
                disabled={subscribing || !email.trim()}
                className="shrink-0 px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#e8c76a', color: '#1a1040' }}
              >
                {subscribing ? 'Signing up…' : 'Subscribe'}
              </button>
            </form>
            {subscribeError && (
              <p className="text-xs mt-2" style={{ color: '#fca5a5' }} role="alert">{subscribeError}</p>
            )}
          </>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActive(null)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: '100%', maxWidth: 340, backgroundColor: '#000' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button — top-right corner of the frame */}
            <button
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' }}
            >
              <X size={16} />
            </button>

            {/* Video */}
            <div className="relative" style={{ aspectRatio: '9/16' }}>
              {active.videoUrl.includes('youtube') ? (
                <>
                  <iframe
                    // Append with the right separator — the old code always used
                    // "?", which broke any URL that already carried a query string.
                    src={`${active.videoUrl}${active.videoUrl.includes('?') ? '&' : '?'}autoplay=1&fs=0&modestbranding=1&rel=0`}
                    title={`Video testimonial from ${active.name}`}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                  {/* cover YouTube channel overlay at top */}
                  <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none" style={{ backgroundColor: '#000' }} />
                  {/* cover YouTube Shorts bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ backgroundColor: '#000' }} />
                </>
              ) : (
                <video src={active.videoUrl} controls autoPlay className="w-full h-full object-cover" />
              )}
            </div>

            {/* Name + quote bar at the bottom */}
            <div className="px-4 py-3" style={{ backgroundColor: '#1a1040' }}>
              <p className="text-white text-sm font-semibold">{active.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>&ldquo;{active.result}&rdquo;</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
