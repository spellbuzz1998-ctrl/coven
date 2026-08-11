import Link from 'next/link'
import { Star, Globe } from 'lucide-react'
import { getSocialLinks } from '@/lib/social'
import SocialIcons from '@/components/SocialIcons'

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All services', href: '/' },
      { label: 'Favorites', href: '/favorites' },
      { label: 'Your cart', href: '/cart' },
      { label: 'Gift a reading', href: '/?q=gift' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Your profile', href: '/account' },
      { label: 'Purchases', href: '/account/purchases' },
      { label: 'Messages', href: '/account/messages' },
      { label: 'Updates', href: '/account/updates' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '/account/help' },
      { label: 'Contact us', href: 'mailto:hello@thirteencoven.com' },
      { label: 'Refund policy', href: '/refund-policy' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & conditions', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Privacy settings', href: '/privacy-policy' },
    ],
  },
]

export default function Footer() {
  const socialLinks = getSocialLinks()
  return (
    <footer className="text-white" style={{ backgroundColor: '#1a1040' }}>
      {/* Top tagline bar */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-2 text-sm text-white/80">
          <Globe size={18} className="shrink-0" />
          <span>Every working is crafted by hand with full intention &amp; care.</span>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-28 md:pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Star size={22} className="text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>
                TheThirteenCoven
              </span>
            </Link>
            <p className="text-sm text-white/60 mt-3 max-w-xs">
              Spell casting, psychic readings &amp; spiritual services — performed with intention since 2019.
            </p>
          </div>

          {/* Link columns */}
          {columns.map(col => (
            <div key={col.title}>
              <h3 className="font-bold mb-3 text-sm">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-yellow-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row: socials + copyright */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50 order-2 sm:order-1">
            © {new Date().getFullYear()} TheThirteenCoven. All rights reserved.
          </p>
          <SocialIcons links={socialLinks} className="order-1 sm:order-2 text-white/70" />
        </div>
      </div>
    </footer>
  )
}
