'use client'
import { useState } from 'react'
import type { Product } from '@/lib/products'
import type { Order } from '@/lib/orders'
import type { Review } from '@/lib/reviews'
import { Trash2, Edit, Plus, Package, ShoppingBag, Star, Eye, EyeOff, MessageCircle, Send } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Props {
  initialProducts: Product[]
  initialOrders: Order[]
  initialReviews: Review[]
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'coven2024'

function useAdminAuth() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function tryLogin() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setErr('Incorrect password')
    }
  }

  return { authed, pw, setPw, err, tryLogin }
}

export default function AdminClient({ initialProducts, initialOrders, initialReviews }: Props) {
  const { authed, pw, setPw, err, tryLogin } = useAdminAuth()
  const [tab, setTab] = useState<'products' | 'orders' | 'reviews' | 'messages'>('products')
  const [products, setProducts] = useState(initialProducts)
  const [orders, setOrders] = useState(initialOrders)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Product>>({
    isActive: true,
    isDigital: true,
    images: [],
    category: 'Love Spells',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            🔮 Admin Login
          </h1>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 mb-3 outline-none"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
          />
          {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
          <button
            onClick={tryLogin}
            className="w-full py-3 rounded-full font-bold text-white"
            style={{ backgroundColor: '#1a1040' }}
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  function setFormField(key: keyof Product, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function saveProduct() {
    if (!form.title || !form.price || !form.slug) return
    setSaving(true)
    const url = editId ? `/api/admin/products/${editId}` : '/api/admin/products'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (editId) {
      setProducts(ps => ps.map(p => p.id === editId ? data.product : p))
    } else {
      setProducts(ps => [data.product, ...ps])
    }
    setShowForm(false)
    setEditId(null)
    setForm({ isActive: true, isDigital: true, images: [], variants: [], category: 'Love Spells' })
    setMsg('Saved!')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  async function updateOrderStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o))
  }

  function startEdit(product: Product) {
    setForm(product)
    setEditId(product.id)
    setShowForm(true)
  }

  const categories = ['Love Spells', 'Protection', 'Readings', 'Money & Prosperity', 'Cleansing', 'Other']

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          🔮 Admin Panel
        </h1>

        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {msg}
          </div>
        )}

        {/* Tab nav */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'products', label: 'Products', icon: Package },
            { key: 'orders', label: 'Orders', icon: ShoppingBag },
            { key: 'reviews', label: 'Reviews', icon: Star },
            { key: 'messages', label: 'Messages', icon: MessageCircle },
          ] as const).map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: tab === t.key ? '#1a1040' : 'white',
                  color: tab === t.key ? 'white' : '#1a1040',
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Products */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm" style={{ color: '#6b6670' }}>{products.length} products</p>
              <button
                onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ isActive: true, isDigital: true, images: [], variants: [], category: 'Love Spells' }) }}
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
                  <div>
                    <label className="block text-xs font-semibold mb-1">Price *</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.price ?? ''} onChange={e => setFormField('price', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Original price (for sale)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.originalPrice ?? ''} onChange={e => setFormField('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.category ?? 'Love Spells'} onChange={e => setFormField('category', e.target.value)}>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Image URL</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={form.images?.[0] ?? ''} onChange={e => setFormField('images', [e.target.value])} placeholder="/images/my-spell.jpg" />
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
        {tab === 'reviews' && (
          <div className="space-y-3">
            {initialReviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{r.reviewerName} · {'⭐'.repeat(r.rating)}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#374151' }}>{r.body}</p>
                    {r.purchasedItem && <p className="text-xs mt-0.5" style={{ color: '#6b6670' }}>Item: {r.purchasedItem}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {tab === 'messages' && <AdminMessages />}
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
      const data = await res.json()
      console.log('[AdminMessages] GET /api/admin/messages →', data)
      if (data.error) {
        setApiError(data.error)
      } else if (data.conversations) {
        setConversations(data.conversations)
        setApiError(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setApiError('Fetch failed: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  async function loadThread(userId: string) {
    const res = await fetch(`/api/admin/messages/${userId}`)
    const data = await res.json()
    console.log(`[AdminMessages] GET /api/admin/messages/${userId} →`, data)
    if (data.messages) setThread(data.messages)
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim() || !selected) return
    setSending(true)
    await fetch(`/api/admin/messages/${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: reply.trim() }),
    })
    setReply('')
    setSending(false)
    loadThread(selected)
    loadConversations()
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
            <form onSubmit={sendReply} className="flex gap-2 p-3 border-t border-gray-100">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(e as unknown as React.FormEvent) } }}
                placeholder="Reply as TheThirteenCoven..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-gray-400"
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
                style={{ backgroundColor: '#1a1040' }}>
                <Send size={15} className="text-white" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
