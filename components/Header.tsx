'use client'
import Link from 'next/link'
import { ShoppingCart, Search, Star, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const count = useCart(s => s.count())
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  const displayCount = mounted ? count : 0
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header style={{ backgroundColor: '#1a1040' }} className="text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-lg tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            TheThirteenCoven
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
          <div className="flex w-full rounded-full overflow-hidden border border-white/20">
            <input
              type="text"
              placeholder="Search for spells, readings, rituals..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
              style={{ backgroundColor: '#f5f0e8' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 text-white flex items-center"
              style={{ backgroundColor: '#c9a84c' }}
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/cart" className="relative flex items-center gap-1 text-sm hover:text-yellow-300 transition-colors">
            <ShoppingCart size={22} />
            {displayCount > 0 && (
              <span
                className="absolute -top-2 -right-2 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#d4760a' }}
              >
                {displayCount}
              </span>
            )}
          </Link>

          <button className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="flex rounded-full overflow-hidden border border-white/20">
            <input
              type="text"
              placeholder="Search spells, readings..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
              style={{ backgroundColor: '#f5f0e8' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="px-4 py-2 text-white" style={{ backgroundColor: '#c9a84c' }}>
              <Search size={16} />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
