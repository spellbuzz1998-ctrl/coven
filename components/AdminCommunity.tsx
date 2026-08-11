'use client'
import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, ExternalLink } from 'lucide-react'

type Platform = 'instagram' | 'youtube' | 'tiktok'
interface Post { id: string; platform: Platform; url: string }

const PLATFORMS: { key: Platform; label: string; hint: string }[] = [
  { key: 'instagram', label: 'Instagram', hint: 'e.g. https://instagram.com/p/XXXX/ or a /reel/ link' },
  { key: 'youtube', label: 'YouTube', hint: 'e.g. https://youtube.com/watch?v=XXXX or a Shorts link' },
  { key: 'tiktok', label: 'TikTok', hint: 'e.g. https://tiktok.com/@you/video/1234567890' },
]

function newId() {
  return (crypto?.randomUUID?.() ?? `p_${Date.now()}_${Math.random().toString(36).slice(2)}`)
}

export default function AdminCommunity() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/community')
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function addPost() {
    setPosts(ps => [...ps, { id: newId(), platform: 'instagram', url: '' }])
  }
  function updatePost(id: string, patch: Partial<Post>) {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
  }
  function removePost(id: string) {
    setPosts(ps => ps.filter(p => p.id !== id))
  }
  function move(id: string, dir: -1 | 1) {
    setPosts(ps => {
      const i = ps.findIndex(p => p.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= ps.length) return ps
      const copy = [...ps]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  async function save() {
    const res = await fetch('/api/admin/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    })
    const data = await res.json()
    setSavedMsg(`Saved! ${data.count} post${data.count === 1 ? '' : 's'} live on the Community tab.`)
    setTimeout(() => setSavedMsg(''), 4000)
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        🌙 Community feed
      </h2>
      <p className="text-sm mb-5 max-w-2xl" style={{ color: '#6b6670' }}>
        Add links to your favourite Instagram, YouTube, and TikTok posts. They show up as live, playable
        embeds on the <strong>Community</strong> tab of your homepage. To keep it fresh, just swap in your
        newest links — the order here is the order they appear.
      </p>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        {loading ? (
          <p className="text-sm" style={{ color: '#9b9670' }}>Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: '#9b9670' }}>No posts yet. Add your first one below.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {posts.map((post, idx) => {
              const hint = PLATFORMS.find(p => p.key === post.platform)?.hint
              return (
                <div key={post.id} className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-100 rounded-lg p-3">
                  <div className="flex flex-col gap-1 sm:w-8 shrink-0">
                    <button onClick={() => move(post.id, -1)} disabled={idx === 0} className="text-xs disabled:opacity-30" style={{ color: '#6b6670' }} title="Move up">▲</button>
                    <button onClick={() => move(post.id, 1)} disabled={idx === posts.length - 1} className="text-xs disabled:opacity-30" style={{ color: '#6b6670' }} title="Move down">▼</button>
                  </div>
                  <select
                    value={post.platform}
                    onChange={e => updatePost(post.id, { platform: e.target.value as Platform })}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none shrink-0"
                  >
                    {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <div className="flex-1 min-w-0">
                    <input
                      value={post.url}
                      onChange={e => updatePost(post.id, { url: e.target.value })}
                      placeholder={hint}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  {post.url.trim() && (
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 shrink-0" style={{ color: '#1a6b5b' }}>
                      Open <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={() => removePost(post.id)} className="shrink-0 p-2 rounded-lg hover:bg-red-50" title="Remove">
                    <Trash2 size={15} className="text-red-500" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addPost}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm border-2"
            style={{ borderColor: '#1a1040', color: '#1a1040' }}
          >
            <Plus size={15} /> Add post
          </button>
          <button
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm"
            style={{ backgroundColor: '#1a1040' }}
          >
            <Save size={15} /> Save feed
          </button>
          {savedMsg && <span className="text-xs" style={{ color: '#1a6b5b' }}>{savedMsg}</span>}
        </div>
      </div>
    </div>
  )
}
