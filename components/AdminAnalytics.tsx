'use client'
import { useEffect, useState } from 'react'
import { Users, Eye, Heart, ShoppingCart, CreditCard, TrendingUp, Save } from 'lucide-react'

interface Summary {
  range: string
  days: number
  totals: {
    visitors: number
    pageviews: number
    productViews: number
    favorites: number
    addToCart: number
    checkouts: number
    purchases: number
    revenue: number
    conversionRate: number
  }
  timeseries: { date: string; pageviews: number; purchases: number }[]
  topProducts: { title: string; slug: string | null; views: number }[]
  topFavorited: { title: string; slug: string | null; count: number }[]
  recentPurchases: { title: string | null; value: number; createdAt: string }[]
}

const RANGES = [
  { key: '24h', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

export default function AdminAnalytics() {
  const [range, setRange] = useState('7d')
  const [reloadKey, setReloadKey] = useState(0)
  const [gaId, setGaId] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Keeping the request key with the payload lets `loading` be derived, and
  // guarantees a slow response for an old range can't overwrite a newer one.
  const requestKey = `${range}|${reloadKey}`
  const [result, setResult] = useState<{ key: string; summary: Summary | null; error: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/analytics?range=${range}`, { signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error('failed')
        return res.json()
      })
      .then(data => {
        setResult({ key: requestKey, summary: data.summary ?? null, error: '' })
        setGaId(data.config?.gaId || '')
        setPixelId(data.config?.pixelId || '')
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Without this the dashboard would show "—" forever.
        setResult({ key: requestKey, summary: null, error: 'Could not load analytics. Please try again.' })
      })
    return () => controller.abort()
  }, [range, requestKey])

  const loading = result?.key !== requestKey
  const summary = result?.key === requestKey ? result.summary : null
  const error = result?.key === requestKey ? result.error : ''

  async function saveConfig() {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaId, pixelId }),
      })
      setSavedMsg(res.ok
        ? 'Saved! Tags will load on the next page visit.'
        : 'Could not save your tracking IDs.')
    } catch {
      setSavedMsg('Could not save your tracking IDs.')
    }
    setSaving(false)
  }

  // Clear the confirmation banner, cancelling the timer if it unmounts first.
  useEffect(() => {
    if (!savedMsg) return
    const id = setTimeout(() => setSavedMsg(''), 4000)
    return () => clearTimeout(id)
  }, [savedMsg])

  const t = summary?.totals

  const cards = [
    { label: 'Visitors', value: t?.visitors ?? 0, icon: Users, color: '#2d1b6b' },
    { label: 'Product views', value: t?.productViews ?? 0, icon: Eye, color: '#1a6b5b' },
    { label: 'Favorites', value: t?.favorites ?? 0, icon: Heart, color: '#e91e8c' },
    { label: 'Add to cart', value: t?.addToCart ?? 0, icon: ShoppingCart, color: '#b8860b' },
    { label: 'Purchases', value: t?.purchases ?? 0, icon: CreditCard, color: '#8b2d5b' },
  ]

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          📊 Traffic & Interactions
        </h2>
        <div className="flex gap-1 bg-white rounded-full p-1 border border-gray-200">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: range === r.key ? '#1a1040' : 'transparent',
                color: range === r.key ? 'white' : '#6b6670',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }} role="alert">
          <span>{error}</span>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#1a1040' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2" style={{ color: c.color }}>
                <Icon size={16} />
                <span className="text-xs font-semibold" style={{ color: '#6b6670' }}>{c.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#1a1040' }}>
                {loading ? '—' : c.value.toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Revenue + conversion strip */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2" style={{ color: '#1a6b5b' }}>
            <TrendingUp size={16} />
            <span className="text-xs font-semibold" style={{ color: '#6b6670' }}>Revenue (tracked)</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1a1040' }}>
            {loading ? '—' : `$${(t?.revenue ?? 0).toFixed(2)}`}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2" style={{ color: '#8b2d5b' }}>
            <CreditCard size={16} />
            <span className="text-xs font-semibold" style={{ color: '#6b6670' }}>Conversion rate</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1a1040' }}>
            {loading ? '—' : `${t?.conversionRate ?? 0}%`}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: '#6b6670' }}>Daily pageviews</p>
        {summary && <BarChart data={summary.timeseries} />}
      </div>

      {/* Top products + most favorited + recent purchases */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-bold mb-3" style={{ color: '#1a1040' }}>Most viewed products</p>
          {summary && summary.topProducts.length === 0 && (
            <p className="text-xs" style={{ color: '#9b9670' }}>No product views yet in this period.</p>
          )}
          <div className="space-y-2">
            {summary?.topProducts.map((p, i) => (
              <div key={p.title} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2" style={{ color: '#374151' }}>
                  <span style={{ color: '#c9a84c', fontWeight: 700 }}>{i + 1}.</span> {p.title}
                </span>
                <span className="font-semibold shrink-0" style={{ color: '#1a1040' }}>{p.views}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} style={{ color: '#e91e8c' }} />
            <p className="text-sm font-bold" style={{ color: '#1a1040' }}>Most favorited</p>
          </div>
          {summary && summary.topFavorited.length === 0 && (
            <p className="text-xs" style={{ color: '#9b9670' }}>No favorites yet in this period.</p>
          )}
          <div className="space-y-2">
            {summary?.topFavorited.map((p, i) => (
              <div key={p.title} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2" style={{ color: '#374151' }}>
                  <span style={{ color: '#e91e8c', fontWeight: 700 }}>{i + 1}.</span> {p.title}
                </span>
                <span className="font-semibold shrink-0" style={{ color: '#e91e8c' }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-bold mb-3" style={{ color: '#1a1040' }}>Recent purchases</p>
          {summary && summary.recentPurchases.length === 0 && (
            <p className="text-xs" style={{ color: '#9b9670' }}>No purchases tracked yet.</p>
          )}
          <div className="space-y-2">
            {summary?.recentPurchases.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2" style={{ color: '#374151' }}>
                  {new Date(p.createdAt + 'Z').toLocaleDateString()} {p.title ? `· ${p.title}` : ''}
                </span>
                <span className="font-semibold shrink-0" style={{ color: '#1a6b5b' }}>${p.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Favorites funnel insight */}
      {summary && (t?.favorites ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 shadow-sm mb-6 border border-pink-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} style={{ color: '#e91e8c' }} />
            <p className="text-sm font-bold" style={{ color: '#1a1040' }}>Favorites insight</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <FunnelStep label="Viewed" value={t?.productViews ?? 0} />
            <FunnelArrow />
            <FunnelStep label="Favorited" value={t?.favorites ?? 0} color="#e91e8c" />
            <FunnelArrow />
            <FunnelStep label="Added to cart" value={t?.addToCart ?? 0} />
            <FunnelArrow />
            <FunnelStep label="Purchased" value={t?.purchases ?? 0} color="#1a6b5b" />
          </div>
          <p className="text-xs mt-3" style={{ color: '#6b6670' }}>
            {(t?.favorites ?? 0) > (t?.addToCart ?? 0)
              ? `${(t?.favorites ?? 0) - (t?.addToCart ?? 0)} people favorited but haven't added to cart yet — a targeted discount could convert them.`
              : 'Your favorites are converting well into cart adds.'}
          </p>
        </div>
      )}

      {/* Third-party tag settings */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-1" style={{ color: '#1a1040' }}>Google Analytics & Meta Pixel</h3>
        <p className="text-xs mb-4" style={{ color: '#6b6670' }}>
          Paste your IDs to send this traffic to Google Analytics and the Meta (Facebook) Pixel too.
          Leave blank to track only in this dashboard.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              GA4 Measurement ID
            </label>
            <input
              value={gaId}
              onChange={e => setGaId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <p className="text-[11px] mt-1" style={{ color: '#9b9670' }}>
              Google Analytics → Admin → Data streams → your stream
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Meta Pixel ID
            </label>
            <input
              value={pixelId}
              onChange={e => setPixelId(e.target.value)}
              placeholder="123456789012345"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <p className="text-[11px] mt-1" style={{ color: '#9b9670' }}>
              Meta Events Manager → Data sources → your pixel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1a1040' }}
          >
            <Save size={15} aria-hidden="true" /> {saving ? 'Saving…' : 'Save IDs'}
          </button>
          {savedMsg && <span className="text-xs" style={{ color: '#15803d' }} role="status">{savedMsg}</span>}
        </div>
      </div>
    </div>
  )
}

function FunnelStep({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold" style={{ color: color ?? '#1a1040' }}>{value.toLocaleString()}</p>
      <p className="text-[11px]" style={{ color: '#6b6670' }}>{label}</p>
    </div>
  )
}

function FunnelArrow() {
  return <span className="text-gray-300 self-center text-lg hidden sm:inline">&rarr;</span>
}

function BarChart({ data }: { data: { date: string; pageviews: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.pageviews))
  return (
    <div className="flex items-end gap-1 h-40" style={{ minHeight: '10rem' }}>
      {data.map((d, i) => {
        const h = (d.pageviews / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.date}: ${d.pageviews} views`}>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${Math.max(h, d.pageviews > 0 ? 4 : 1)}%`,
                backgroundColor: d.pageviews > 0 ? '#2d1b6b' : '#e5e0d5',
                minHeight: '2px',
              }}
            />
            {data.length <= 14 && (
              <span className="text-[9px] mt-1 text-center" style={{ color: '#9b9670' }}>
                {d.date.slice(5).replace('-', '/')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
