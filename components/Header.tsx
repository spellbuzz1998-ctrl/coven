'use client'
import Link from 'next/link'
import { ShoppingCart, Search, Star, Menu, X, Home, Heart, User, MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCartCount } from '@/lib/cart'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/account', icon: User, label: 'You' },
  { href: '/account/messages', icon: MessageCircle, label: 'Messages' },
]

export default function Header() {
  const displayCount = useCartCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

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
            ThirteenCoven
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} role="search" className="flex-1 max-w-xl hidden sm:flex">
          <div className="flex w-full rounded-full overflow-hidden border border-white/20">
            <label htmlFor="site-search" className="sr-only">Search the shop</label>
            <input
              id="site-search"
              type="search"
              placeholder="Search for spells, readings, rituals..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
              style={{ backgroundColor: '#f5f0e8' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Search"
              className="px-4 py-2 text-white flex items-center"
              style={{ backgroundColor: '#b8912f' }}
            >
              <Search size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Desktop nav — mirrors the mobile floating menu (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => {
              const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-1.5 text-sm transition-colors hover:text-yellow-300"
                  style={active ? { color: '#facc15' } : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <Link
            href="/cart"
            aria-label={displayCount > 0 ? `Cart, ${displayCount} item${displayCount === 1 ? '' : 's'}` : 'Cart, empty'}
            className="relative flex items-center gap-1 text-sm hover:text-yellow-300 transition-colors"
          >
            <ShoppingCart size={22} aria-hidden="true" />
            {displayCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#b5620a' }}
              >
                {displayCount}
              </span>
            )}
          </Link>

          <button
            className="sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close search menu' : 'Open search menu'}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearch} role="search" className="flex rounded-full overflow-hidden border border-white/20">
            <label htmlFor="site-search-mobile" className="sr-only">Search the shop</label>
            <input
              id="site-search-mobile"
              type="search"
              placeholder="Search spells, readings..."
              className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
              style={{ backgroundColor: '#f5f0e8' }}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search" className="px-4 py-2 text-white" style={{ backgroundColor: '#b8912f' }}>
              <Search size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
