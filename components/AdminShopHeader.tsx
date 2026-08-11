'use client'
import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'

const DEFAULTS = {
  shop_name: 'TheThirteenCoven',
  shop_tagline: 'Authentic spell casting, readings & spiritual rituals',
  shop_badge: 'Practitioner since 2018',
}

export default function AdminShopHeader() {
  const [values, setValues] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/shop-header')
      .then(r => r.json())
      .then(data => {
        setValues({
          shop_name: data.shop_name || DEFAULTS.shop_name,
          shop_tagline: data.shop_tagline || DEFAULTS.shop_tagline,
          shop_badge: data.shop_badge || DEFAULTS.shop_badge,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function save() {
    const res = await fetch('/api/admin/shop-header', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      setSavedMsg('Saved! Refresh your homepage to see changes.')
      setTimeout(() => setSavedMsg(''), 4000)
    }
  }

  function update(key: keyof typeof values, val: string) {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  if (loading) return <p className="text-sm" style={{ color: '#9b9670' }}>Loading…</p>

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Shop header
      </h2>
      <p className="text-sm mb-5 max-w-2xl" style={{ color: '#6b6670' }}>
        Edit the name, tagline, and badge that appear at the top of your homepage.
      </p>

      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Shop name</label>
          <input
            value={values.shop_name}
            onChange={e => update('shop_name', e.target.value)}
            placeholder={DEFAULTS.shop_name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            maxLength={60}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Tagline</label>
          <input
            value={values.shop_tagline}
            onChange={e => update('shop_tagline', e.target.value)}
            placeholder={DEFAULTS.shop_tagline}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#6b6670' }}>Badge text</label>
          <input
            value={values.shop_badge}
            onChange={e => update('shop_badge', e.target.value)}
            placeholder={DEFAULTS.shop_badge}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            maxLength={60}
          />
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Shown next to the moon icon, e.g. &ldquo;Practitioner since 2018&rdquo;</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm"
            style={{ backgroundColor: '#1a1040' }}
          >
            <Save size={15} /> Save header
          </button>
          {savedMsg && <span className="text-xs" style={{ color: '#1a6b5b' }}>{savedMsg}</span>}
        </div>
      </div>
    </div>
  )
}
