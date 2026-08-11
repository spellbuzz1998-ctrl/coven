'use client'
import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import type { Product } from '@/lib/products'
import type { Order } from '@/lib/orders'
import type { Review } from '@/lib/reviews'
import { Trash2, Edit, Plus, Package, ShoppingBag, Star, MessageCircle, Send, Upload, X, ImageIcon, Video, Tag, ToggleLeft, ToggleRight, Palette, BarChart3, Share2, Users, Mail } from 'lucide-react'
import AdminAnalytics from './AdminAnalytics'
import AdminSocial from './AdminSocial'
import AdminCommunity from './AdminCommunity'
import AdminArticles from './AdminArticles'
import AdminShopHeader from './AdminShopHeader'

interface Props {
  initialAuthed: boolean
  initialProducts: Product[]
  initialOrders: Order[]
  initialReviews: Review[]
}

const PRODUCT_CATEGORIES = ['Love Spells', 'Protection', 'Readings', 'Money & Prosperity', 'Cleansing', 'Other']

const ADMIN_TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'sales', label: 'Sales', icon: Tag },
  { key: 'social', label: 'Social', icon: Share2 },
  { key: 'community', label: 'Community', icon: Users },
  { key: 'newsletter', label: 'Newsletter', icon: Mail },
  { key: 'branding', label: 'Pages', icon: Palette },
] as const

const EMPTY_PRODUCT_FORM = {
  isActive: true,
  isDigital: true,
  images: [] as string[],
  video: '',
  variants: [],
  category: 'Love Spells',
}

// Reads the clock once, on the client only. Calling Date.now() during render
// makes output differ between renders (and between server and client), which
// React flags as impure. The snapshot is cached so it stays stable; the server
// snapshot is 0 and ptTimeAgo renders nothing for that first pass.
let cachedNow = 0
const subscribeNever = () => () => {}
const serverNow = () => 0
const clientNow = () => (cachedNow ||= Date.now())

function useNow(): number {
  return useSyncExternalStore(subscribeNever, clientNow, serverNow)
}

// Turns any failed admin request into a readable message instead of letting
// `res.json()` throw on an HTML error page and blank the panel.
async function readJson(res: Response): Promise<{ ok: boolean; data: Record<string, unknown>; error?: string }> {
  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  if (!res.ok) {
    if (res.status === 401) return { ok: false, data, error: 'Your admin session expired — please log in again.' }
    return { ok: false, data, error: (data.error as string) || `Request failed (${res.status})` }
  }
  return { ok: true, data }
}

function useAdminAuth(initialAuthed: boolean) {
  const [authed] = useState(initialAuthed)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function tryLogin() {
    if (busy) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (res.ok) {
        // Reload so the server re-renders the page with the session cookie
        window.location.reload()
        return
      }
      const data = await res.json().catch(() => ({}))
      setErr(data.error || 'Incorrect password')
    } catch {
      setErr('Login failed — check your connection and try again')
    }
    setBusy(false)
  }

  return { authed, pw, setPw, err, busy, tryLogin }
}

export default function AdminClient({ initialAuthed, initialProducts, initialOrders, initialReviews }: Props) {
  const { authed, pw, setPw, err, busy, tryLogin } = useAdminAuth(initialAuthed)
  const [tab, setTab] = useState<'products' | 'orders' | 'reviews' | 'messages' | 'sales' | 'branding' | 'analytics' | 'social' | 'community' | 'newsletter'>('products')
  const [products, setProducts] = useState(initialProducts)
  const [orders, setOrders] = useState(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Product> & { video?: string; saleEndsAt?: string }>({
    isActive: true,
    isDigital: true,
    images: [],
    video: '',
    category: 'Love Spells',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [errMsg, setErrMsg] = useState('')

  // Auto-clear the success banner, and clear the timer on unmount.
  useEffect(() => {
    if (!msg) return
    const id = setTimeout(() => setMsg(''), 3000)
    return () => clearTimeout(id)
  }, [msg])

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            🔮 Admin Login
          </h1>
          <label htmlFor="admin-password" className="sr-only">Admin password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 mb-3 outline-none"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') tryLogin() }}
          />
          {err && <p className="text-xs mb-2" style={{ color: '#b91c1c' }} role="alert">{err}</p>}
          <button
            onClick={tryLogin}
            disabled={busy || !pw}
            className="w-full py-3 rounded-full font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1a1040' }}
          >
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </div>
    )
  }

  function setFormField(key: keyof Product, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function saveProduct() {
    // Guard against a second click while the first save is still running.
    if (saving) return
    if (!form.title?.trim() || !form.slug?.trim() || !Number.isFinite(form.price) || (form.price ?? 0) <= 0) {
      setErrMsg('Title, slug and a price greater than 0 are required.')
      return
    }
    setSaving(true)
    setErrMsg('')
    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products'
    const method = editId ? 'PATCH' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const { ok, data, error } = await readJson(res)
      const saved = data.product as Product | undefined
      // Without this check a failed save would push `undefined` into the list
      // and the next render would crash the whole admin panel.
      if (!ok || !saved?.id) {
        setErrMsg(error || 'The product could not be saved.')
        setSaving(false)
        return
      }
      if (editId) {
        setProducts(ps => ps.map(p => p.id === editId ? saved : p))
      } else {
        setProducts(ps => [saved, ...ps])
      }
      setShowForm(false)
      setEditId(null)
      setForm({ ...EMPTY_PRODUCT_FORM })
      setMsg('Saved!')
    } catch {
      setErrMsg('Could not reach the server. Please check your connection.')
    }
    setSaving(false)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    const previous = products
    setProducts(ps => ps.filter(p => p.id !== id))
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
    } catch {
      setProducts(previous)
      setErrMsg('That product could not be deleted.')
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    const previous = orders
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o))
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      setOrders(previous)
      setErrMsg('The order status could not be updated.')
    }
  }

  function startEdit(product: Product) {
    setForm(product)
    setEditId(product.id)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          🔮 Admin Panel
        </h1>

        {msg && (
          <div className="px-4 py-2 rounded-lg mb-4 text-sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }} role="status">
            {msg}
          </div>
        )}

        {errMsg && (
          <div className="px-4 py-2 rounded-lg mb-4 text-sm flex items-start justify-between gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }} role="alert">
            <span>{errMsg}</span>
            <button onClick={() => setErrMsg('')} aria-label="Dismiss" className="shrink-0 font-bold">×</button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <div className="shrink-0 w-44">
            <nav className="flex flex-col gap-1 sticky top-6">
              {ADMIN_TABS.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    aria-current={tab === t.key ? 'page' : undefined}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left w-full"
                    style={{
                      backgroundColor: tab === t.key ? '#1a1040' : 'transparent',
                      color: tab === t.key ? 'white' : '#1a1040',
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">

        {/* Products */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm" style={{ color: '#6b6670' }}>{products.length} products</p>
              <button
                onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...EMPTY_PRODUCT_FORM }) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#c9a84c' }}
              >
                <Plus size={16} />
                Add product
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="font-bold mb-4" style={{ color: '#1a1040' }}>{editId ? 'Edit product' : 'New product'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Title *</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.title ?? ''} onChange={e => setFormField('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Slug * (URL-friendly)</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.slug ?? ''} onChange={e => setFormField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Regular Price * <span className="font-normal text-gray-400">(sale price is auto-calculated from Shop-wide Discount in Sales tab)</span></label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.price ?? ''} onChange={e => setFormField('price', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.category ?? 'Love Spells'} onChange={e => setFormField('category', e.target.value)}>
                      {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-2">Product Images (up to 15)</label>
                    <MediaUploader
                      images={form.images ?? []}
                      video={form.video ?? ''}
                      onImagesChange={urls => setFormField('images', urls)}
                      onVideoChange={url => setFormField('video', url)}
                      productTitle={form.title}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Description</label>
                    <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none" value={form.description ?? ''} onChange={e => setFormField('description', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Personalization prompt</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.personalizationPrompt ?? ''} onChange={e => setFormField('personalizationPrompt', e.target.value)} placeholder="Please provide: your name, DOB, and situation..." />
                  </div>
                  {/* Variants */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold">Variants (optional — e.g. Basic / Standard / Premium)</label>
                      <button
                        type="button"
                        onClick={() => setFormField('variants', [...(form.variants ?? []), { name: '', price: 0, originalPrice: undefined }])}
                        className="text-xs px-3 py-1 rounded-full font-semibold text-white"
                        style={{ backgroundColor: '#c9a84c' }}
                      >
                        + Add variant
                      </button>
                    </div>
                    {(form.variants ?? []).length === 0 && (
                      <p className="text-xs italic" style={{ color: '#6b6670' }}>No variants — product uses its base price above.</p>
                    )}
                    {(form.variants ?? []).map((v, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-center">
                        <input
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                          placeholder="Variant name (e.g. Basic)"
                          value={v.name}
                          onChange={e => {
                            const updated = [...(form.variants ?? [])]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setFormField('variants', updated)
                          }}
                        />
                        <input
                          type="number" step="0.01"
                          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                          placeholder="Price"
                          value={v.price || ''}
                          onChange={e => {
                            const updated = [...(form.variants ?? [])]
                            updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 }
                            setFormField('variants', updated)
                          }}
                        />
                        <input
                          type="number" step="0.01"
                          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                          placeholder="Orig. price"
                          value={v.originalPrice ?? ''}
                          onChange={e => {
                            const updated = [...(form.variants ?? [])]
                            updated[i] = { ...updated[i], originalPrice: e.target.value ? parseFloat(e.target.value) : undefined }
                            setFormField('variants', updated)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.variants ?? []).filter((_, j) => j !== i)
                            setFormField('variants', updated)
                          }}
                          className="text-red-500 text-lg font-bold px-1"
                        >×</button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isDigital ?? true} onChange={e => setFormField('isDigital', e.target.checked)} />
                      Digital product
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isActive ?? true} onChange={e => setFormField('isActive', e.target.checked)} />
                      Active (visible)
                    </label>
                  </div>

                  {editId && (
                    <div className="sm:col-span-2 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                      <ProductTestimonialsEditor productId={editId} />
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={saveProduct} disabled={saving} className="px-6 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: '#1a1040' }}>
                    {saving ? 'Saving...' : 'Save product'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-semibold text-sm border border-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Product list */}
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{p.title}</span>
                      {!p.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Hidden</span>}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs" style={{ color: '#6b6670' }}>
                      <span>${p.price}</span>
                      <span>{p.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-gray-100">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 && <p style={{ color: '#6b6670' }} className="text-sm">No orders yet.</p>}
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-xl px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{o.customerEmail}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b6670' }}>{new Date(o.createdAt).toLocaleDateString()} · ${o.total.toFixed(2)}</p>
                  </div>
                  <select
                    value={o.status}
                    onChange={e => updateOrderStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {tab === 'reviews' && <AdminReviews initialReviews={initialReviews} />}

        {/* Messages */}
        {tab === 'analytics' && <AdminAnalytics />}

        {tab === 'social' && <AdminSocial />}

        {tab === 'community' && (
          <div className="space-y-12">
            <AdminArticles />
            <AdminCommunity />
          </div>
        )}

        {tab === 'messages' && <AdminMessages />}

        {/* Sales & Discounts */}
        {tab === 'sales' && <AdminDiscounts />}

        {/* Newsletter */}
        {tab === 'newsletter' && <AdminNewsletter />}

        {/* Branding */}
        {tab === 'branding' && (
          <div className="space-y-12">
            <AdminShopHeader />
            <AdminBranding />
            <AdminPages />
            <AdminAbout />
          </div>
        )}

          </div> {/* end main content */}
        </div> {/* end flex row */}
      </div>
    </div>
  )
}

// ─── Admin Reviews ────────────────────────────────────────────────────────────
function AdminReviews({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [editing, setEditing] = useState<Review | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  function toDateInput(iso: string) {
    return iso ? iso.slice(0, 10) : ''
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/admin/reviews/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerName: editing.reviewerName,
        rating: editing.rating,
        body: editing.body,
        createdAt: editing.createdAt,
      }),
    })
    setReviews(prev => prev.map(r => r.id === editing.id ? editing : r))
    setSaving(false)
    setSaved(editing.id)
    setTimeout(() => setSaved(null), 2000)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  // "now" is captured once per mount rather than read during render, so the
  // markup stays stable between renders and matches what the server produced.
  const now = useNow()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#1a1040' }}>{reviews.length} reviews</p>
        <p className="text-xs text-gray-400">Click Edit to change name, date, rating or text</p>
      </div>

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: '#2d1b6b' }}>
              {r.reviewerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{r.reviewerName}</span>
                <span className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f3f0ff', color: '#2d1b6b' }}>
                  {ptTimeAgo(r.createdAt, now)}
                </span>
                {saved === r.id && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
              </div>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: '#374151' }}>{r.body}</p>
              {r.purchasedItem && <p className="text-xs mt-0.5 text-gray-400 truncate">Item: {r.purchasedItem}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing({ ...r })}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ backgroundColor: '#f3f0ff', color: '#2d1b6b' }}>Edit</button>
              <button onClick={() => handleDelete(r.id)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600">Del</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-bold" style={{ color: '#1a1040' }}>Edit review</h3>

            <div>
              <label className="text-xs font-semibold text-gray-600">Reviewer name</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d5db' }}
                value={editing.reviewerName}
                onChange={e => setEditing({ ...editing, reviewerName: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Rating</label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setEditing({ ...editing, rating: n })}
                    className="text-2xl transition-transform"
                    style={{ opacity: n <= editing.rating ? 1 : 0.3 }}>★</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Date (controls &ldquo;X days ago&rdquo; shown to buyers)</label>
              <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d5db' }}
                value={toDateInput(editing.createdAt)}
                onChange={e => setEditing({ ...editing, createdAt: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : editing.createdAt })} />
              <p className="text-xs mt-1 text-gray-400">Will show as: <strong>{ptTimeAgo(editing.createdAt, now)}</strong></p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Review text</label>
              <textarea rows={4} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: '#d1d5db' }}
                value={editing.body}
                onChange={e => setEditing({ ...editing, body: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: '#d1d5db', color: '#374151' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: '#1a1040' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProductTestimonial {
  id: string
  type: 'video' | 'text' | 'image'
  name: string
  result: string
  initials: string
  thumbnailColor: string
  videoUrl: string
  imageUrl: string
  rating: number
  date: string
}

const PT_COLORS = ['#2d1b6b', '#1a1040', '#4a2080', '#3b1f78', '#5c2a90']

function ptTimeAgo(dateStr: string, now: number = Date.now()) {
  if (!dateStr || !now) return ''
  const diff = now - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

function blankItem(type: 'video' | 'text' | 'image', count: number): ProductTestimonial {
  return {
    id: Date.now().toString(),
    type,
    name: '',
    result: '',
    initials: '',
    thumbnailColor: PT_COLORS[count % PT_COLORS.length],
    videoUrl: '',
    imageUrl: '',
    rating: 5,
    date: new Date().toISOString(),
  }
}

function ImageTestimonialUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) onChange(data.url)
    setUploading(false)
  }

  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">Screenshot / image</label>
      <div className="mt-1 flex flex-col gap-2">
        {value ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an already-optimised Cloudinary upload; not a public LCP image */}
            <img src={value} alt="Uploaded testimonial screenshot" className="w-full h-40 object-cover rounded-xl" />
            <button onClick={() => onChange('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => ref.current?.click()}
            disabled={uploading}
            className="w-full py-6 rounded-xl border-2 border-dashed text-xs font-medium text-gray-400 flex flex-col items-center gap-1"
            style={{ borderColor: '#d1d5db' }}>
            <span className="text-2xl">🖼</span>
            {uploading ? 'Uploading…' : 'Tap to upload image'}
          </button>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    </div>
  )
}

function ProductTestimonialsEditor({ productId }: { productId: string }) {
  // Storing the product id alongside the list means switching products clears
  // the previous testimonials without a setState at the top of the effect.
  const [loaded, setLoaded] = useState<{ id: string; items: ProductTestimonial[] } | null>(null)
  const [editing, setEditing] = useState<ProductTestimonial | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const items = loaded?.id === productId ? loaded.items : []
  const setItems = (next: ProductTestimonial[]) => setLoaded({ id: productId, items: next })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/admin/products/${productId}/testimonials`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((data: ProductTestimonial[]) => {
        setLoaded({ id: productId, items: Array.isArray(data) ? data : [] })
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setLoaded({ id: productId, items: [] })
        setError('Could not load testimonials for this product.')
      })
    return () => controller.abort()
  }, [productId])

  // Clear the "saved" flag without leaving a timer running after unmount.
  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(id)
  }, [saved])

  async function saveAll(updated: ProductTestimonial[]) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/products/${productId}/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!res.ok) throw new Error('failed')
      setSaved(true)
    } catch {
      setError('Those testimonials could not be saved.')
    }
    setSaving(false)
  }

  async function handleSave() {
    if (!editing) return
    const initials = editing.initials || editing.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const item = { ...editing, initials }
    const updated = items.find(i => i.id === editing.id)
      ? items.map(i => i.id === editing.id ? item : i)
      : [...items, item]
    setItems(updated)
    setEditing(null)
    await saveAll(updated)
  }

  async function handleDelete(id: string) {
    const updated = items.filter(i => i.id !== id)
    setItems(updated)
    await saveAll(updated)
  }

  function ytId(url: string) {
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/)
    return m ? m[1] : null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold" style={{ color: '#1a1040' }}>Client Testimonials for this product</p>
          <p className="text-xs text-gray-400">Add video or text testimonials shown on this product page</p>
        </div>
        {saved && <span className="text-xs font-medium" style={{ color: '#15803d' }} role="status">✓ Saved</span>}
      </div>

      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: '#b91c1c', backgroundColor: '#fef2f2' }} role="alert">{error}</p>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic mb-3">No testimonials yet — add a video or text card below.</p>
      )}

      <div className="space-y-2 mb-3">
        {items.map((item, idx) => {
          const vid = item.type === 'video' ? ytId(item.videoUrl) : null
          return (
            <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border bg-white" style={{ borderColor: '#e5e7eb' }}>
              {/* Sort arrows */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  disabled={idx === 0}
                  onClick={() => { const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setItems(a); saveAll(a) }}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs disabled:opacity-20"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>▲</button>
                <button
                  disabled={idx === items.length - 1}
                  onClick={() => { const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; setItems(a); saveAll(a) }}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs disabled:opacity-20"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>▼</button>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0"
                style={{
                  backgroundColor: item.type === 'video' ? '#fef3c7' : item.type === 'image' ? '#fce7f3' : '#e8eaf6',
                  color: item.type === 'video' ? '#92400e' : item.type === 'image' ? '#9d174d' : '#1a237e'
                }}>
                {item.type === 'video' ? '▶ Video' : item.type === 'image' ? '🖼 Image' : '★ Text'}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail served straight from YouTube's CDN */}
              {vid && <img src={`https://img.youtube.com/vi/${vid}/default.jpg`} alt="" className="w-14 h-9 object-cover rounded shrink-0" />}
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail of an already-optimised Cloudinary upload */}
              {item.type === 'image' && item.imageUrl && <img src={item.imageUrl} alt="" className="w-14 h-9 object-cover rounded shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{item.name || <span className="text-gray-400">No name</span>}</p>
                <p className="text-xs text-gray-400 truncate">{item.result || item.videoUrl || '—'}</p>
                {item.date && <p className="text-xs" style={{ color: '#9ca3af' }}>{ptTimeAgo(item.date)}</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setEditing({ ...item })} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#f3f0ff', color: '#2d1b6b' }}>Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600">Del</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setEditing(blankItem('video', items.length))}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 border-dashed"
          style={{ borderColor: '#c9a84c', color: '#c9a84c', minWidth: 120 }}>
          ▶ Add video testimonial
        </button>
        <button onClick={() => setEditing(blankItem('text', items.length))}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 border-dashed"
          style={{ borderColor: '#3f51b5', color: '#3f51b5', minWidth: 120 }}>
          ★ Add text testimonial
        </button>
        <button onClick={() => setEditing(blankItem('image', items.length))}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 border-dashed"
          style={{ borderColor: '#9d174d', color: '#9d174d', minWidth: 120 }}>
          🖼 Add image testimonial
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-3 my-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold flex-1" style={{ color: '#1a1040' }}>
                {items.find(i => i.id === editing.id) ? 'Edit' : 'Add'} {editing.type} testimonial
              </h3>
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: editing.type === 'video' ? '#fef3c7' : editing.type === 'image' ? '#fce7f3' : '#e8eaf6',
                  color: editing.type === 'video' ? '#92400e' : editing.type === 'image' ? '#9d174d' : '#1a237e'
                }}>
                {editing.type === 'video' ? '▶ Video' : editing.type === 'image' ? '🖼 Image' : '★ Text'}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Client name</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d5db' }}
                value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Sarah M." />
            </div>

            {editing.type === 'text' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Rating</label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setEditing({ ...editing, rating: n })}
                        className="text-2xl" style={{ opacity: n <= editing.rating ? 1 : 0.25 }}>★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Review text</label>
                  <textarea rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: '#d1d5db' }}
                    value={editing.result} onChange={e => setEditing({ ...editing, result: e.target.value })} placeholder="e.g. He came back in 2 weeks after the spell!" />
                </div>
              </>
            )}

            {editing.type === 'image' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Review text / quote</label>
                  <textarea rows={3} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: '#d1d5db' }}
                    value={editing.result} onChange={e => setEditing({ ...editing, result: e.target.value })} placeholder="e.g. She is amazing, my ex came back!" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Rating</label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setEditing({ ...editing, rating: n })}
                        className="text-2xl" style={{ opacity: n <= editing.rating ? 1 : 0.25 }}>★</button>
                    ))}
                  </div>
                </div>
                <ImageTestimonialUploader value={editing.imageUrl || ''} onChange={url => setEditing({ ...editing, imageUrl: url })} />
              </>
            )}

            {editing.type === 'video' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Short quote (shown below the card)</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d5db' }}
                    value={editing.result} onChange={e => setEditing({ ...editing, result: e.target.value })} placeholder="e.g. He came back in 2 weeks" />
                </div>
                <VideoUrlPicker value={editing.videoUrl} onChange={url => setEditing({ ...editing, videoUrl: url })} />
                <div>
                  <label className="text-xs font-semibold text-gray-600">Card color</label>
                  <div className="flex gap-2 mt-1">
                    {PT_COLORS.map(c => (
                      <button key={c} onClick={() => setEditing({ ...editing, thumbnailColor: c })}
                        className="w-7 h-7 rounded-full border-2"
                        style={{ backgroundColor: c, borderColor: editing.thumbnailColor === c ? '#c9a84c' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-600">Date (shows as &ldquo;X days ago&rdquo;)</label>
              <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: '#d1d5db' }}
                value={editing.date ? editing.date.slice(0, 10) : ''}
                onChange={e => setEditing({ ...editing, date: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : editing.date })} />
              {editing.date && <p className="text-xs mt-1 text-gray-400">Will show as: <strong>{ptTimeAgo(editing.date)}</strong></p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: '#d1d5db', color: '#374151' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !editing.name} className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: '#1a1040' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable video URL picker (paste URL or upload to YouTube) ───────────────
function VideoUrlPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [ytConnected, setYtConnected] = useState<boolean | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const vidRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/youtube').then(r => r.json()).then(d => setYtConnected(d.connected))
  }, [])

  function ytId(url: string) {
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/)
    return m ? m[1] : (url.length === 11 ? url : null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', 'Client Testimonial')
    fd.append('description', 'TheThirteenCoven — Client Testimonial')
    const interval = setInterval(() => setProgress(p => Math.min(p + 7, 90)), 800)
    const res = await fetch('/api/admin/youtube', { method: 'POST', body: fd })
    const data = await res.json()
    clearInterval(interval)
    setProgress(100)
    setTimeout(() => { setUploading(false); setProgress(0) }, 500)
    if (data.videoId) onChange(`https://www.youtube.com/watch?v=${data.videoId}`)
    else alert('Upload failed: ' + (data.error || 'Unknown error'))
    if (vidRef.current) vidRef.current.value = ''
  }

  const vid = ytId(value)

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-600">Video</label>

      {/* Paste URL row */}
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
        style={{ borderColor: '#d1d5db' }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste YouTube URL or upload below..."
      />

      {/* Upload button row */}
      <div className="flex items-center gap-2">
        {ytConnected === false && (
          <a href="/api/auth/youtube" target="_blank"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white bg-red-600">
            Connect YouTube first
          </a>
        )}
        {ytConnected === true && (
          <button type="button" onClick={() => vidRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: '#c9a84c' }}>
            <Video size={11} />
            {uploading ? `Uploading ${progress}%` : 'Upload to YouTube'}
          </button>
        )}
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs px-3 py-1.5 rounded-full font-medium bg-red-50 text-red-500">
            Remove
          </button>
        )}
      </div>
      <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />

      {/* Progress bar */}
      {uploading && (
        <div className="rounded-full overflow-hidden h-1.5 bg-gray-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: '#c9a84c' }} />
        </div>
      )}

      {/* Preview thumbnail */}
      {vid && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only preview served straight from YouTube's CDN
        <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt="Video preview thumbnail"
          className="w-full rounded-xl object-cover mt-1" style={{ height: 120 }} />
      )}
    </div>
  )
}

const STATIC_PAGES = [
  { slug: 'terms', label: 'Terms & Conditions' },
  { slug: 'disclaimer', label: 'Disclaimer' },
  { slug: 'refund-policy', label: 'Refund Policy' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
]

function AdminPages() {
  const [contents, setContents] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/pages').then(r => r.json()).then((data: Record<string, string>) => {
      const mapped: Record<string, string> = {}
      for (const p of STATIC_PAGES) mapped[p.slug] = data[`page_${p.slug}`] ?? ''
      setContents(mapped)
    })
  }, [])

  async function handleSave(slug: string) {
    setSaving(slug)
    await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, content: contents[slug] ?? '' }),
    })
    setSaving(null)
    setSaved(slug)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1040' }}>Pages</h2>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Edit the content for your shop&apos;s legal and info pages.</p>

      <div className="space-y-3">
        {STATIC_PAGES.map(p => (
          <div key={p.slug} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
            <button
              onClick={() => setOpen(open === p.slug ? null : p.slug)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-sm font-bold" style={{ color: '#1a1040' }}>{p.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                  /{p.slug} · {contents[p.slug] ? `${contents[p.slug].length} chars` : 'No content yet'}
                </p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                {open === p.slug ? 'Close ▲' : 'Edit ▼'}
              </span>
            </button>

            {open === p.slug && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: '#f3f4f6' }}>
                <textarea
                  rows={12}
                  className="w-full mt-4 border rounded-xl px-4 py-3 text-sm outline-none resize-y leading-relaxed"
                  style={{ borderColor: '#d1d5db', color: '#1a1040' }}
                  placeholder={`Write your ${p.label} content here…`}
                  value={contents[p.slug] ?? ''}
                  onChange={e => setContents({ ...contents, [p.slug]: e.target.value })}
                />
                <div className="flex items-center justify-between mt-3">
                  <a href={`/${p.slug}`} target="_blank" rel="noreferrer"
                    className="text-xs underline" style={{ color: '#c9a84c' }}>
                    Preview page ↗
                  </a>
                  <button
                    onClick={() => handleSave(p.slug)}
                    disabled={saving === p.slug}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#1a1040' }}>
                    {saving === p.slug ? 'Saving…' : saved === p.slug ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface Subscriber {
  id: number
  email: string
  subscribed_at: string
  unsubscribed_at: string | null
}

function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/newsletter').then(r => r.json()).then(data => {
      setSubscribers(data.subscribers ?? [])
      setLoading(false)
    })
  }, [])

  async function handleDelete(id: number) {
    setDeleting(id)
    await fetch('/api/admin/newsletter', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSubscribers(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  const activeSubscribers = subscribers.filter(s => !s.unsubscribed_at)

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1040' }}>Newsletter subscribers</h2>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
        {activeSubscribers.length} subscriber{activeSubscribers.length !== 1 ? 's' : ''} signed up via your newsletter form.
      </p>

      {loading ? (
        <p className="text-sm" style={{ color: '#9ca3af' }}>Loading…</p>
      ) : subscribers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: '#d6cfc2', backgroundColor: '#faf7f1' }}>
          <p className="text-3xl mb-2">📧</p>
          <p className="text-sm font-medium" style={{ color: '#6b6670' }}>No subscribers yet</p>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>When someone subscribes via the newsletter form, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#1a1040' }}>Email</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: '#1a1040' }}>Subscribed</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(s => (
                <tr key={s.id} className="border-t" style={{ borderColor: '#f3f4f6' }}>
                  <td className="px-4 py-3" style={{ color: '#1a1040' }}>{s.email}</td>
                  <td className="px-4 py-3" style={{ color: '#6b7280' }}>
                    {new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove subscriber"
                    >
                      <Trash2 size={14} className={deleting === s.id ? 'text-gray-300' : 'text-red-400'} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminAbout() {
  const [heading, setHeading] = useState('')
  const [body, setBody] = useState('')
  const [commitments, setCommitments] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/about').then(r => r.json()).then((data: Record<string, string>) => {
      setHeading(data.about_heading ?? '')
      setBody(data.about_body ?? '')
      setCommitments(data.about_commitments ?? '')
      setContactEmail(data.about_contact_email ?? '')
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about_heading: heading,
        about_body: body,
        about_commitments: commitments,
        about_contact_email: contactEmail,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1040' }}>About page</h2>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Edit the content shown in your shop&apos;s About tab.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1a1040' }}>Heading</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: '#d1d5db', color: '#1a1040' }}
            placeholder="About TheThirteenCoven"
            value={heading}
            onChange={e => setHeading(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1a1040' }}>About text</label>
          <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>Separate paragraphs with a blank line.</p>
          <textarea
            rows={8}
            className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-y leading-relaxed"
            style={{ borderColor: '#d1d5db', color: '#1a1040' }}
            placeholder="Tell visitors about your practice, experience, and what makes your services unique…"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1a1040' }}>Commitments</label>
          <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>One per line. Shown in the purple &quot;My Commitment to You&quot; box.</p>
          <textarea
            rows={5}
            className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-y leading-relaxed"
            style={{ borderColor: '#d1d5db', color: '#1a1040' }}
            placeholder={"100% confidential & discreet service\nPersonalized rituals tailored to your situation\nRitual photo & report delivered to your email"}
            value={commitments}
            onChange={e => setCommitments(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1a1040' }}>Contact email</label>
          <input
            type="email"
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: '#d1d5db', color: '#1a1040' }}
            placeholder="hello@thirteencoven.com"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: '#1a1040' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save about page'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminBranding() {
  const [bannerUrl, setBannerUrl] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState<'banner' | 'avatar' | null>(null)
  const [saved, setSaved] = useState<'banner' | 'avatar' | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/branding').then(r => r.json()).then(data => {
      if (data.shop_banner_url) setBannerUrl(data.shop_banner_url)
      if (data.shop_avatar_url) setAvatarUrl(data.shop_avatar_url)
    })
  }, [])

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    return data.url ?? null
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('banner')
    const url = await uploadFile(file, 'branding')
    if (url) {
      setBannerUrl(url)
      await fetch('/api/admin/branding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'shop_banner_url', value: url }) })
      setSaved('banner')
      setTimeout(() => setSaved(null), 2000)
    }
    setUploading(null)
    if (bannerRef.current) bannerRef.current.value = ''
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('avatar')
    const url = await uploadFile(file, 'branding')
    if (url) {
      setAvatarUrl(url)
      await fetch('/api/admin/branding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'shop_avatar_url', value: url }) })
      setSaved('avatar')
      setTimeout(() => setSaved(null), 2000)
    }
    setUploading(null)
    if (avatarRef.current) avatarRef.current.value = ''
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: '#1a1040' }}>Shop Branding</h2>
        <p className="text-sm text-gray-500">Update the banner and profile image shown on your shop homepage.</p>
      </div>

      {/* Banner */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: '#1a1040' }}>Banner / Cover Image</p>
        <div
          className="relative w-full rounded-xl overflow-hidden mb-3 flex items-center justify-center cursor-pointer group"
          style={{ height: 140, backgroundColor: '#1a1040', background: bannerUrl ? undefined : 'linear-gradient(135deg, #1a1040 0%, #2d1b6b 40%, #1a1040 100%)' }}
          onClick={() => bannerRef.current?.click()}
        >
          {bannerUrl
            // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an already-optimised Cloudinary upload
            ? <img src={bannerUrl} alt="Current shop banner" className="w-full h-full object-cover" />
            : <p className="text-white/40 text-sm italic">TheThirteenCoven</p>
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-sm font-semibold flex items-center gap-2"><Upload size={16} /> {uploading === 'banner' ? 'Uploading...' : 'Change banner'}</p>
          </div>
          {saved === 'banner' && <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓ Saved</div>}
        </div>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        <p className="text-xs text-gray-400">Recommended: 1200 × 300px. JPG or PNG.</p>
      </div>

      {/* Avatar */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: '#1a1040' }}>Profile / Avatar Image</p>
        <div className="flex items-center gap-4">
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer group shrink-0 border-4 border-white shadow-lg"
            style={{ backgroundColor: '#2d1b6b' }}
            onClick={() => avatarRef.current?.click()}
          >
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an already-optimised Cloudinary upload
              ? <img src={avatarUrl} alt="Current shop avatar" className="w-full h-full object-cover" />
              : <span className="text-3xl">🔮</span>
            }
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Upload size={14} className="text-white" />
            </div>
            {saved === 'avatar' && <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center rounded-full"><span className="text-white text-lg">✓</span></div>}
          </div>
          <div>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploading === 'avatar'}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#1a1040' }}
            >
              {uploading === 'avatar' ? 'Uploading...' : 'Upload photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">Square image, min 200 × 200px.</p>
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>
    </div>
  )
}

interface AdminConversation {
  user_id: string
  display_name: string
  last_message: string
  last_at: string
  unread: number
}

interface AdminMessage {
  id: string
  user_id: string
  sender: 'customer' | 'seller'
  body: string
  image_url?: string | null
  created_at: string
}

function AdminMessages() {
  const [conversations, setConversations] = useState<AdminConversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [thread, setThread] = useState<AdminMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadLengthRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  // Load conversations + auto-refresh every 5s
  useEffect(() => {
    loadConversations()
    const timer = setInterval(loadConversations, 5000)
    return () => clearInterval(timer)
  }, [])

  // Reset initial load flag whenever we switch conversations
  useEffect(() => {
    if (!selected) return
    isInitialLoadRef.current = true
    threadLengthRef.current = 0
    loadThread(selected)
    const timer = setInterval(() => loadThread(selected), 3000)
    return () => clearInterval(timer)
  }, [selected])

  // Scroll to bottom only when a new message arrives (not on initial load)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // First load — don't auto-scroll, let user see from the top
      isInitialLoadRef.current = false
    } else if (thread.length > threadLengthRef.current) {
      // A new message was added — smooth scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    threadLengthRef.current = thread.length
  }, [thread])

  async function loadConversations() {
    try {
      const res = await fetch('/api/admin/messages')
      const { ok, data, error } = await readJson(res)
      if (!ok) {
        setApiError(error || 'Could not load conversations.')
      } else if (data.conversations) {
        setConversations(data.conversations as AdminConversation[])
        setApiError(null)
      }
    } catch {
      setApiError('Could not reach the server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function loadThread(userId: string) {
    try {
      const res = await fetch(`/api/admin/messages/${userId}`)
      const { ok, data } = await readJson(res)
      if (ok && data.messages) setThread(data.messages as AdminMessage[])
    } catch {
      // The 3s poll will pick it up again; don't disturb the open thread.
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !reply.trim() || !selected) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/admin/messages/${selected}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      })
      if (!res.ok) throw new Error('failed')
      setReply('')
      loadThread(selected)
      loadConversations()
    } catch {
      // Keep the typed reply so it isn't lost.
      setSendError('Your reply could not be sent. Please try again.')
    }
    setSending(false)
  }

  if (loading) return <div className="text-center py-8 text-gray-400">Loading messages...</div>

  if (apiError) {
    return (
      <div className="text-center py-12">
        <p className="font-semibold text-red-600 mb-2">API Error</p>
        <p className="text-sm font-mono bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-left max-w-lg mx-auto">{apiError}</p>
        <p className="text-xs mt-3" style={{ color: '#6b6670' }}>Check the browser console and server terminal for details.</p>
        <button onClick={loadConversations} className="mt-4 px-4 py-2 rounded-full text-sm text-white" style={{ backgroundColor: '#1a1040' }}>Retry</button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-semibold" style={{ color: '#1a1040' }}>No messages yet</p>
        <p className="text-sm mt-1" style={{ color: '#6b6670' }}>Customer messages will appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
      {/* Conversation list */}
      <div className="md:col-span-1 space-y-2 overflow-y-auto" style={{ maxHeight: 500 }}>
        {conversations.map(c => (
          <button
            key={c.user_id}
            onClick={() => setSelected(c.user_id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{ backgroundColor: selected === c.user_id ? '#f5f0e8' : 'white', border: `2px solid ${selected === c.user_id ? '#1a1040' : '#e5e7eb'}` }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ backgroundColor: '#1a1040' }}>
              {c.display_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-xs" style={{ color: '#1a1040' }}>{c.display_name}</p>
                {c.unread > 0 && (
                  <span className="text-xs font-bold text-white rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#d4760a' }}>
                    {c.unread}
                  </span>
                )}
              </div>
              <p className="text-xs truncate" style={{ color: '#6b6670' }}>{c.last_message}</p>
              <p className="text-xs mt-0.5" style={{ color: '#c9a84c' }}>
                {new Date(c.last_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="md:col-span-2 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ maxHeight: 500 }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
            <MessageCircle size={32} />
            <p className="text-sm">Select a conversation to view</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3" style={{ backgroundColor: '#f5f0e8' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#1a1040' }}>
                {(conversations.find(c => c.user_id === selected)?.display_name ?? 'C').slice(0, 1).toUpperCase()}
              </div>
              <p className="font-semibold text-sm" style={{ color: '#1a1040' }}>{conversations.find(c => c.user_id === selected)?.display_name ?? 'Customer'}</p>
              <span className="text-xs ml-auto" style={{ color: '#6b6670' }}>{thread.length} message{thread.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No messages in this thread.</p>
              )}
              {thread.map(msg => {
                const isSeller = msg.sender === 'seller'
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isSeller ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: isSeller ? '#c9a84c' : '#1a1040', color: 'white' }}>
                      {isSeller ? '🔮' : '👤'}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-xs ${isSeller ? 'items-end' : 'items-start'}`}>
                      {msg.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.image_url} alt="Sent image" className="rounded-xl object-cover" style={{ maxWidth: 180 }} />
                      )}
                      {msg.body && (
                        <div className="px-3 py-2 rounded-2xl text-sm"
                          style={{
                            backgroundColor: isSeller ? '#1a1040' : '#f5f0e8',
                            color: isSeller ? 'white' : '#1a1040',
                            borderBottomRightRadius: isSeller ? 4 : 16,
                            borderBottomLeftRadius: isSeller ? 16 : 4,
                          }}>
                          {msg.body}
                        </div>
                      )}
                      <p className={`text-xs ${isSeller ? 'text-right' : ''}`} style={{ color: '#9ca3af' }}>
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-gray-100">
              {sendError && (
                <p className="text-xs px-3 pt-2" style={{ color: '#b91c1c' }} role="alert">{sendError}</p>
              )}
              <form onSubmit={sendReply} className="flex gap-2 p-3">
                <label htmlFor="admin-reply" className="sr-only">Reply to customer</label>
                <input
                  id="admin-reply"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Reply as TheThirteenCoven…"
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-gray-400"
                />
                <button type="submit" disabled={sending || !reply.trim()}
                  aria-label="Send reply"
                  className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  style={{ backgroundColor: '#1a1040' }}>
                  <Send size={15} className="text-white" aria-hidden="true" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Media Uploader Component ──────────────────────────────────────────────
function MediaUploader({
  images, video, onImagesChange, onVideoChange, productTitle
}: {
  images: string[]
  video: string
  onImagesChange: (urls: string[]) => void
  onVideoChange: (url: string) => void
  productTitle?: string
}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [ytConnected, setYtConnected] = useState<boolean | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const imgRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/youtube').then(r => r.json()).then(d => setYtConnected(d.connected))
  }, [])

  async function uploadImages(files: File[]) {
    const remaining = 15 - images.length
    const toUpload = files.slice(0, remaining)
    const newUrls: string[] = []
    for (const file of toUpload) {
      setUploading(file.name)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'products')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) newUrls.push(data.url)
    }
    setUploading(null)
    onImagesChange([...images, ...newUrls])
    if (imgRef.current) imgRef.current.value = ''
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('video')
    setVideoProgress(0)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', productTitle || 'Product Video')
    fd.append('description', `TheThirteenCoven — ${productTitle || 'Product Video'}`)

    // Simulate progress (YouTube API doesn't give progress via fetch)
    const progressInterval = setInterval(() => {
      setVideoProgress(p => Math.min(p + 8, 90))
    }, 800)

    const res = await fetch('/api/admin/youtube', { method: 'POST', body: fd })
    const data = await res.json()
    clearInterval(progressInterval)
    setVideoProgress(100)
    setTimeout(() => { setUploading(null); setVideoProgress(0) }, 500)

    if (data.videoId) {
      onVideoChange(data.videoId)
    } else {
      alert('Upload failed: ' + (data.error || 'Unknown error'))
    }
    if (vidRef.current) vidRef.current.value = ''
  }

  function removeImage(idx: number) {
    onImagesChange(images.filter((_, i) => i !== idx))
  }

  // Extract YouTube video ID from stored value
  const youtubeId = video?.match(/(?:v=|embed\/|youtu\.be\/)([^&\n?#]+)/)?.[1] || video

  return (
    <div className="space-y-4">
      {/* Images section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{images.length}/15 images uploaded</span>
          {images.length < 15 && (
            <button type="button" onClick={() => imgRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white"
              style={{ backgroundColor: '#1a1040' }}>
              <Upload size={12} /> {uploading && uploading !== 'video' ? `Uploading ${uploading}...` : 'Upload Images'}
            </button>
          )}
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => uploadImages(Array.from(e.target.files ?? []))} />

        {images.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1a1040', fontSize: 9 }}>Main</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div onClick={() => imgRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <ImageIcon size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-400">Click to upload product images</p>
            <p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP — up to 15 photos</p>
          </div>
        )}
      </div>

      {/* Video section — YouTube */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Product Video (YouTube)</span>
            {ytConnected === true && <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#16a34a' }}>✓ Connected</span>}
            {ytConnected === false && <span className="text-xs px-2 py-0.5 rounded-full text-white bg-red-500">Not connected</span>}
          </div>
          <div className="flex gap-2">
            {ytConnected === false && (
              <a href="/api/auth/youtube" target="_blank"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white bg-red-600">
                Connect YouTube
              </a>
            )}
            {ytConnected && !video && (
              <button type="button" onClick={() => vidRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white"
                style={{ backgroundColor: '#c9a84c' }}>
                <Video size={12} /> {uploading === 'video' ? `Uploading ${videoProgress}%` : 'Upload Video'}
              </button>
            )}
          </div>
        </div>
        <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

        {/* Upload progress bar */}
        {uploading === 'video' && (
          <div className="mb-2 rounded-full overflow-hidden h-2 bg-gray-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${videoProgress}%`, backgroundColor: '#c9a84c' }} />
          </div>
        )}

        {youtubeId ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="w-full rounded-xl"
              style={{ height: 200 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button type="button" onClick={() => onVideoChange('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => ytConnected ? vidRef.current?.click() : undefined}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center transition-colors"
            style={{ cursor: ytConnected ? 'pointer' : 'default' }}>
            <Video size={24} className="mx-auto mb-2 text-gray-300" />
            {ytConnected
              ? <><p className="text-xs text-gray-400">Click to upload video to YouTube</p><p className="text-xs text-gray-300 mt-1">MP4, MOV — uploaded as Unlisted on your channel</p></>
              : <><p className="text-xs text-gray-400">Connect YouTube first</p><p className="text-xs text-gray-300 mt-1">Click &quot;Connect YouTube&quot; button above</p></>
            }
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Admin Discounts ─────────────────────────────────────────────────────────

interface CouponRow {
  id: string
  code: string
  discount_type: string
  amount: number
  description?: string
  offer_type: string
  usage_limit?: number
  used_count: number
  min_order_amount?: number
  expires_at?: string
  is_active: number
  created_at: string
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  promo_code: 'Promo Code',
  shop_sale: 'Shop-wide Sale',
  abandoned_cart: 'Abandoned Cart Offer',
  favorited_item: 'Favorited Item Offer',
  thank_you: 'Thank You Offer',
}

function AdminDiscounts() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shopSaleEndDate, setShopSaleEndDate] = useState('')
  const [shopSaleDiscount, setShopSaleDiscount] = useState('')
  const [saleMsg, setSaleMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'promo' | 'offers'>('promo')
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', amount: '', description: '',
    offer_type: 'promo_code', usage_limit: '', min_order_amount: '', expires_at: '',
  })

  const applyLoaded = (data: Record<string, unknown>) => {
    setCoupons((data.coupons as CouponRow[]) || [])
    const settings = data.settings as Record<string, string> | undefined
    if (settings?.shop_sale_end_date) setShopSaleEndDate(settings.shop_sale_end_date.slice(0, 10))
    if (settings?.shop_sale_discount) setShopSaleDiscount(settings.shop_sale_discount)
    setLoadError('')
    setLoading(false)
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/discounts')
      const { ok, data } = await readJson(res)
      if (ok) applyLoaded(data)
      else { setLoadError('Could not load your discounts.'); setLoading(false) }
    } catch {
      setLoadError('Could not reach the server.')
      setLoading(false)
    }
  }

  async function saveShopSale() {
    await Promise.all([
      fetch('/api/admin/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: 'shop_sale_end_date', setting_value: shopSaleEndDate }),
      }),
      fetch('/api/admin/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: 'shop_sale_discount', setting_value: shopSaleDiscount }),
      }),
    ])
    setSaleMsg('Saved! All product pages now show the sale price and end date.')
  }

  async function clearShopSale() {
    await Promise.all([
      fetch('/api/admin/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: 'shop_sale_end_date', setting_value: '' }),
      }),
      fetch('/api/admin/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: 'shop_sale_discount', setting_value: '' }),
      }),
    ])
    setShopSaleEndDate('')
    setShopSaleDiscount('')
    setSaleMsg('Shop-wide sale cleared.')
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/discounts', { signal: controller.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then(applyLoaded)
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setLoadError('Could not load your discounts.')
        setLoading(false)
      })
    return () => controller.abort()
  }, [])

  // Clear the sale confirmation without leaving a timer running after unmount.
  useEffect(() => {
    if (!saleMsg) return
    const id = setTimeout(() => setSaleMsg(''), 4000)
    return () => clearTimeout(id)
  }, [saleMsg])

  async function createCoupon() {
    if (!form.code || !form.amount) return
    setSaving(true)
    await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : undefined,
        expires_at: form.expires_at || undefined,
      }),
    })
    setMsg('Created!'); setTimeout(() => setMsg(''), 3000)
    setShowForm(false)
    setForm({ code: '', discount_type: 'percentage', amount: '', description: '', offer_type: 'promo_code', usage_limit: '', min_order_amount: '', expires_at: '' })
    setSaving(false); load()
  }

  async function toggleActive(coupon: CouponRow) {
    await fetch(`/api/admin/discounts/${coupon.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    }); load()
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Delete this discount?')) return
    await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' }); load()
  }

  const promoCoupons = coupons.filter(c => c.offer_type === 'promo_code')
  const offerCoupons = coupons.filter(c => c.offer_type !== 'promo_code')

  return (
    <div>
      {msg && <div className="px-4 py-2 rounded-lg mb-4 text-sm" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }} role="status">{msg}</div>}
      {loadError && <div className="px-4 py-2 rounded-lg mb-4 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }} role="alert">{loadError}</div>}

      {/* Sub tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'promo', label: '🏷️ Promo Codes' }, { key: 'offers', label: '🎁 Offers & Sales' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as 'promo' | 'offers')}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: activeTab === t.key ? '#c9a84c' : 'white', color: activeTab === t.key ? 'white' : '#1a1040' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Promo Codes Tab ── */}
      {activeTab === 'promo' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: '#6b6670' }}>{promoCoupons.length} promo codes</p>
            <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, offer_type: 'promo_code' })) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#c9a84c' }}>
              <Plus size={16} /> Create promo code
            </button>
          </div>

          {showForm && form.offer_type === 'promo_code' && (
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="font-bold mb-4" style={{ color: '#1a1040' }}>New Promo Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Code *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase outline-none" placeholder="e.g. WELCOME20"
                    value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Discount type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                    <option value="percentage">Percentage off (%)</option>
                    <option value="fixed">Fixed amount off ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Amount * {form.discount_type === 'percentage' ? '(%)' : '($)'}</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Usage limit (optional)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Unlimited"
                    value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Min. order ($)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="No minimum"
                    value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Expires on</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Internal note</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. For Instagram followers"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={createCoupon} disabled={saving} className="px-6 py-2 rounded-full font-bold text-sm text-white" style={{ backgroundColor: '#1a1040' }}>
                  {saving ? 'Saving…' : 'Create code'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-full font-bold text-sm" style={{ backgroundColor: '#f0ebe0', color: '#1a1040' }}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <p className="text-sm text-gray-400">Loading…</p> : (
            <div className="space-y-3">
              {promoCoupons.length === 0 && <p className="text-sm text-gray-400 italic">No promo codes yet. Create your first one above.</p>}
              {promoCoupons.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm px-2 py-0.5 rounded" style={{ backgroundColor: '#f5f0e8', color: '#1a1040' }}>{c.code}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.is_active ? '#d4edda' : '#f0f0f0', color: c.is_active ? '#155724' : '#888' }}>
                        {c.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#c9a84c' }}>
                      {c.discount_type === 'percentage' ? `${c.amount}% off` : `$${c.amount} off`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6b6670' }}>
                      Used: {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}
                      {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      {c.min_order_amount && ` · Min $${c.min_order_amount}`}
                      {c.description && ` · ${c.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(c)} title={c.is_active ? 'Pause' : 'Activate'}>
                      {c.is_active ? <ToggleRight size={28} style={{ color: '#c9a84c' }} /> : <ToggleLeft size={28} style={{ color: '#ccc' }} />}
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Offers & Sales Tab ── */}
      {activeTab === 'offers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: '#6b6670' }}>Automatic discount offers</p>
            <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, offer_type: 'abandoned_cart', code: 'CARTBACK' })) }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#c9a84c' }}>
              <Plus size={16} /> Add offer
            </button>
          </div>

          {showForm && form.offer_type !== 'promo_code' && (
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h3 className="font-bold mb-4" style={{ color: '#1a1040' }}>New Offer</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Offer type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.offer_type} onChange={e => setForm(f => ({ ...f, offer_type: e.target.value }))}>
                    <option value="abandoned_cart">Abandoned Cart</option>
                    <option value="favorited_item">Favorited Item</option>
                    <option value="thank_you">Thank You (repeat buyer)</option>
                    <option value="shop_sale">Shop-wide Sale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Promo code</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase outline-none"
                    value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Discount %</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Expires on</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={createCoupon} disabled={saving} className="px-6 py-2 rounded-full font-bold text-sm text-white" style={{ backgroundColor: '#1a1040' }}>
                  {saving ? 'Saving…' : 'Create offer'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-full font-bold text-sm" style={{ backgroundColor: '#f0ebe0', color: '#1a1040' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Shop-wide Sale card */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-4" style={{ border: '2px solid #c9a84c' }}>
            <h4 className="font-bold text-sm mb-1" style={{ color: '#1a1040' }}>🔥 Shop-wide Sale</h4>
            <p className="text-xs mb-4" style={{ color: '#6b6670' }}>
              Set a discount % and end date. All product pages will show the sale price, strikethrough original price, % off, and &quot;Sale ends on [date]&quot; in green.
            </p>
            {saleMsg && <p className="text-xs mb-3 font-semibold" style={{ color: '#16a34a' }}>{saleMsg}</p>}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Discount %</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1" max="99"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none pr-8"
                    placeholder="e.g. 45"
                    value={shopSaleDiscount}
                    onChange={e => setShopSaleDiscount(e.target.value)}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Sale ends on</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                  value={shopSaleEndDate}
                  onChange={e => setShopSaleEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={saveShopSale} className="px-5 py-2 rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#c9a84c' }}>
                Save
              </button>
              {(shopSaleEndDate || shopSaleDiscount) && (
                <button onClick={clearShopSale} className="px-5 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: '#f0ebe0', color: '#1a1040' }}>
                  Clear sale
                </button>
              )}
            </div>

            {(shopSaleDiscount || shopSaleEndDate) && (
              <div className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="font-semibold" style={{ color: '#15803d' }}>
                  ✓ Active: {shopSaleDiscount ? `${shopSaleDiscount}% off` : ''}{shopSaleDiscount && shopSaleEndDate ? ' · ' : ''}{shopSaleEndDate ? `Sale ends on ${new Date(shopSaleEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : ''}
                </p>
                <p style={{ color: '#166534' }}>Showing discounted prices on all product pages</p>
              </div>
            )}
          </div>

          {/* Other offer type cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(['abandoned_cart', 'favorited_item', 'thank_you'] as const).map(type => {
              const coupon = offerCoupons.find(c => c.offer_type === type)
              const info: Record<string, { emoji: string; desc: string }> = {
                abandoned_cart: { emoji: '🛒', desc: 'Sent when shoppers add to cart but don\'t check out' },
                favorited_item: { emoji: '❤️', desc: 'Sent when shoppers favorite one of your items' },
                thank_you: { emoji: '🎉', desc: 'Sent after a purchase to encourage repeat buyers' },
              }
              return (
                <div key={type} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-sm" style={{ color: '#1a1040' }}>{info[type].emoji} {OFFER_TYPE_LABELS[type]}</h4>
                    {coupon && (
                      <button onClick={() => toggleActive(coupon)}>
                        {coupon.is_active ? <ToggleRight size={24} style={{ color: '#c9a84c' }} /> : <ToggleLeft size={24} style={{ color: '#ccc' }} />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs mb-3" style={{ color: '#6b6670' }}>{info[type].desc}</p>
                  {coupon ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#f5f0e8' }}>{coupon.code}</span>
                        <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>{coupon.amount}% off</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: coupon.is_active ? '#d4edda' : '#f0f0f0', color: coupon.is_active ? '#155724' : '#888' }}>
                          {coupon.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#6b6670' }}>Used {coupon.used_count} times</p>
                      <button onClick={() => deleteCoupon(coupon.id)} className="text-xs text-red-400 mt-2 hover:text-red-600">Remove</button>
                    </div>
                  ) : (
                    <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, offer_type: type, code: type.toUpperCase().replace('_', '') })) }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#f5f0e8', color: '#1a1040' }}>
                      Set up →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
