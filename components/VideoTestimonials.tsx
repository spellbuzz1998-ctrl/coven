'use client'
import { useState } from 'react'
import { Play, X } from 'lucide-react'

interface VideoTestimonial {
  id: string
  name: string
  result: string
  thumbnailColor: string
  videoUrl: string // YouTube embed URL or direct mp4
  initials: string
}

// Replace these with real video URLs — YouTube embed or direct mp4
const testimonials: VideoTestimonial[] = [
  {
    id: '1',
    name: 'Sarah M.',
    result: 'He came back in 2 weeks',
    thumbnailColor: '#2d1b6b',
    videoUrl: '', // e.g. https://www.youtube.com/embed/VIDEO_ID
    initials: 'SM',
  },
  {
    id: '2',
    name: 'Destiny R.',
    result: 'He texted after 6 weeks silence',
    thumbnailColor: '#1a1040',
    videoUrl: '',
    initials: 'DR',
  },
  {
    id: '3',
    name: 'jasmine_l',
    result: 'Reading was 100% accurate',
    thumbnailColor: '#4a2080',
    videoUrl: '',
    initials: 'JL',
  },
]

function VideoCard({ t, onClick }: { t: VideoTestimonial; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden shrink-0 flex flex-col text-left"
      style={{ width: 160, minHeight: 240, backgroundColor: t.thumbnailColor }}
    >
      {/* Thumbnail background */}
      <div className="flex-1 flex items-center justify-center relative w-full">
        {/* Decorative stars */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #c9a84c 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white z-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}
        >
          {t.initials}
        </div>
        {/* Play button */}
        <div
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
          style={{ backgroundColor: '#c9a84c' }}
        >
          <Play size={16} fill="white" color="white" />
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2">
        <p className="text-white font-semibold text-xs">{t.name}</p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
          &ldquo;{t.result}&rdquo;
        </p>
      </div>
    </button>
  )
}

export default function VideoTestimonials() {
  const [active, setActive] = useState<VideoTestimonial | null>(null)

  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Client video testimonials
      </h2>
      <p className="text-sm mb-4" style={{ color: '#6b6670' }}>Real results from real clients</p>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {testimonials.map(t => (
          <VideoCard key={t.id} t={t} onClick={() => t.videoUrl ? setActive(t) : null} />
        ))}

        {/* Add more CTA card */}
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

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setActive(null)}
        >
          <div className="relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white flex items-center gap-1 text-sm"
              onClick={() => setActive(null)}
            >
              <X size={18} /> Close
            </button>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
              {active.videoUrl.includes('youtube') ? (
                <iframe
                  src={active.videoUrl + '?autoplay=1'}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video src={active.videoUrl} controls autoPlay className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-white text-center mt-3 font-medium">{active.name} — &ldquo;{active.result}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  )
}
