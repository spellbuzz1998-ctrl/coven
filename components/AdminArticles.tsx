'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Save, Trash2, Eye, EyeOff, Edit, ArrowLeft, X, Upload, ImageIcon } from 'lucide-react'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  coverImage: string | null
  tags: string[]
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

type View = 'list' | 'edit'

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [editArticle, setEditArticle] = useState<Article | null>(null)
  const [msg, setMsg] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadArticles() }, [])

  async function loadArticles() {
    setLoading(true)
    const res = await fetch('/api/admin/articles')
    const data = await res.json()
    setArticles(data.articles ?? [])
    setLoading(false)
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'articles')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setCoverImage(data.url)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function openNew() {
    setEditArticle(null)
    setTitle('')
    setExcerpt('')
    setBody('')
    setCoverImage('')
    setTagsInput('')
    setMetaTitle('')
    setMetaDescription('')
    setIsPublished(false)
    setView('edit')
  }

  function openEdit(a: Article) {
    setEditArticle(a)
    setTitle(a.title)
    setExcerpt(a.excerpt)
    setBody(a.body)
    setCoverImage(a.coverImage ?? '')
    setTagsInput(a.tags.join(', '))
    setMetaTitle(a.metaTitle ?? '')
    setMetaDescription(a.metaDescription ?? '')
    setIsPublished(a.isPublished)
    setView('edit')
  }

  async function handleSave() {
    if (!title.trim()) { setMsg('Title is required'); return }
    setSaving(true)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      action: editArticle ? 'update' : 'create',
      id: editArticle?.id,
      title, excerpt, body,
      coverImage: coverImage.trim() || null,
      tags,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      isPublished,
    }
    await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setMsg(editArticle ? 'Article updated!' : 'Article created!')
    setTimeout(() => setMsg(''), 3000)
    await loadArticles()
    setView('list')
  }

  async function handleDelete(id: string) {
    await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    await loadArticles()
  }

  if (view === 'edit') {
    const charCount = metaDescription.length
    return (
      <div>
        <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm mb-4" style={{ color: '#6b6670' }}>
          <ArrowLeft size={14} /> Back to articles
        </button>

        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          {editArticle ? 'Edit article' : 'New article'}
        </h3>

        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How Moon Phases Affect Your Love Life"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" maxLength={200} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Excerpt / summary</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="A short summary shown in the article card (1-2 sentences)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={2} maxLength={300} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Body</label>
            <p className="text-[11px] mb-1.5" style={{ color: '#9ca3af' }}>
              Use ## for headings, **bold**, *italic*, and blank lines for paragraphs.
            </p>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write your article content here..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-y font-mono" rows={14} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Cover image</label>
            {coverImage ? (
              <div className="relative inline-block mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an already-optimised Cloudinary upload */}
                <img src={coverImage} alt="Article cover preview" className="w-full max-w-md h-40 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => setCoverImage('')}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 w-full max-w-md justify-center py-8 border-2 border-dashed rounded-xl text-sm font-medium transition-colors hover:border-gray-400"
                style={{ borderColor: '#d1d5db', color: uploading ? '#9ca3af' : '#6b6670', backgroundColor: '#fafaf9' }}>
                {uploading ? (
                  <><Upload size={16} className="animate-pulse" /> Uploading…</>
                ) : (
                  <><ImageIcon size={16} /> Click to upload cover image</>
                )}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Tags (comma separated)</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. love spells, moon rituals, tarot" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
          </div>

          {/* SEO section */}
          <div className="border-t pt-4 mt-4" style={{ borderColor: '#e5e7eb' }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#1a1040' }}>SEO settings</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Meta title</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                  placeholder={title || 'Defaults to article title'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" maxLength={70} />
                <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>{metaTitle.length}/70 characters</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Meta description</label>
                <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
                  placeholder={excerpt || 'Defaults to article excerpt'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none" rows={2} maxLength={160} />
                <p className="text-[11px] mt-0.5" style={{ color: charCount > 155 ? '#dc2626' : '#9ca3af' }}>{charCount}/160 characters</p>
              </div>
            </div>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => setIsPublished(!isPublished)}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: isPublished ? '#1a6b5b' : '#6b6670' }}>
              {isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
              {isPublished ? 'Published' : 'Draft'}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm"
              style={{ backgroundColor: '#1a1040', opacity: saving ? 0.6 : 1 }}>
              <Save size={15} /> {saving ? 'Saving...' : (editArticle ? 'Update article' : 'Create article')}
            </button>
            {msg && <span className="text-xs" style={{ color: '#1a6b5b' }}>{msg}</span>}
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            Articles
          </h3>
          <p className="text-xs" style={{ color: '#6b6670' }}>
            Write articles that appear on the Community tab. Good for SEO — each article gets its own page.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm text-white"
          style={{ backgroundColor: '#1a1040' }}>
          <Plus size={15} /> New article
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#9b9670' }}>Loading…</p>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: '#d6cfc2', backgroundColor: '#faf7f1' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6670' }}>No articles yet.</p>
          <p className="text-xs" style={{ color: '#9ca3af' }}>Articles help bring organic traffic to your shop via Google.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              {a.coverImage && (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-only list thumbnail of an already-optimised Cloudinary upload */}
                  <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#1a1040' }}>{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: a.isPublished ? '#dcfce7' : '#f3f4f6',
                      color: a.isPublished ? '#166534' : '#6b7280',
                    }}>
                    {a.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {a.tags.length > 0 && (
                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>{a.tags.slice(0, 3).join(', ')}</span>
                  )}
                </div>
              </div>
              <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-gray-50" title="Edit">
                <Edit size={15} style={{ color: '#6b6670' }} />
              </button>
              <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-50" title="Delete">
                <Trash2 size={15} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      {msg && <p className="text-xs mt-3" style={{ color: '#1a6b5b' }}>{msg}</p>}
    </div>
  )
}
