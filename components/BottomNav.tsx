'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Heart, User, ShoppingCart, MessageCircle } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { Suspense, useEffect, useState } from 'react'

function NavInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const count = useCart(s => s.count())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Hide on product detail pages and messages chat page
  if (pathname.startsWith('/product/')) return null
  if (pathname === '/account/messages') return null

  const displayCount = mounted ? count : 0

  function isActive(key: string) {
    if (key === 'home')     return pathname === '/' && !tab
    if (key === 'favorites') return pathname === '/favorites'
    if (key === 'you')      return pathname.startsWith('/account') && pathname !== '/account/messages'
    if (key === 'cart')     return pathname === '/cart'
    if (key === 'messages') return pathname === '/account/messages'
    return false
  }

  const items = [
    { key: 'home',      href: '/',                    icon: Home,           label: 'Home' },
    { key: 'favorites', href: '/favorites',           icon: Heart,          label: 'Favorites' },
    { key: 'you',       href: '/account',             icon: User,           label: 'You' },
    { key: 'cart',      href: '/cart',                icon: ShoppingCart,   label: 'Cart',     badge: displayCount },
    { key: 'messages',  href: '/account/messages',   icon: MessageCircle,  label: 'Messages' },
  ]

  return (
    <nav
      className="flex items-center justify-around rounded-full px-1 py-1.5"
      style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
    >
      {items.map(({ key, href, icon: Icon, label, badge }) => {
        const active = isActive(key)
        return (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all relative"
          >
            {active && (
              <span className="absolute inset-0 rounded-full" style={{ backgroundColor: '#1a1040' }} />
            )}
            <span className="relative">
              <Icon size={22} style={{ color: active ? 'white' : '#6b6670' }} strokeWidth={active ? 2.5 : 1.8} />
              {badge != null && badge > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 text-white font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#d4760a', fontSize: 9, width: 16, height: 16 }}
                >
                  {badge}
                </span>
              )}
            </span>
            <span className="relative font-medium" style={{ color: active ? 'white' : '#6b6670', fontSize: 10 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function BottomNav() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <Suspense fallback={null}>
        <NavInner />
      </Suspense>
    </div>
  )
}
