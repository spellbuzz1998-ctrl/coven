'use client'
import { useEffect, useState } from 'react'
import { Save, ExternalLink } from 'lucide-react'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/yourhandle' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
]

export default function AdminSocial() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/social')
      .then(r => r.json())
      .then((data: Record<string, string>) => { setValues(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function setField(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function save() {
    await fetch('/api/admin/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSavedMsg('Saved! Your links are now live on the site.')
    setTimeout(() => setSavedMsg(''), 4000)
  }

  const activeCount = PLATFORMS.filter(p => (values[p.key] || '').trim()).length

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        🔗 Social media links
      </h2>
      <p className="text-sm mb-5" style={{ color: '#6b6670' }}>
        Paste the full link to each of your profiles. Only the ones you fill in will appear on your site —
        they show in the footer (every page) and under your shop name on the homepage.
      </p>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          {PLATFORMS.map(p => {
            const val = values[p.key] || ''
            return (
              <div key={p.key}>
                <label className="flex items-center justify-between text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                  <span>{p.label}</span>
                  {val.trim() && (
                    <a href={val} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" style={{ color: '#1a6b5b' }}>
                      Test <ExternalLink size={11} />
                    </a>
                  )}
                </label>
                <input
                  value={loading ? '' : val}
                  onChange={e => setField(p.key, e.target.value)}
                  placeholder={p.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm"
            style={{ backgroundColor: '#1a1040' }}
          >
            <Save size={15} /> Save links
          </button>
          <span className="text-xs" style={{ color: '#6b6670' }}>{activeCount} active</span>
          {savedMsg && <span className="text-xs" style={{ color: '#1a6b5b' }}>{savedMsg}</span>}
        </div>
      </div>
    </div>
  )
}
