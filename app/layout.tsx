import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import CartProvider from '@/components/CartProvider'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import AuthProvider from '@/components/AuthProvider'
import SiteAnalytics from '@/components/SiteAnalytics'

// Set NEXT_PUBLIC_SITE_URL in production so canonical URLs and social previews
// resolve to the real domain rather than relative paths.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TheThirteenCoven — Spell Casting & Spiritual Services',
    template: '%s | TheThirteenCoven',
  },
  description: 'Powerful spell casting, psychic readings, and spiritual services by TheThirteenCoven. Love spells, protection rituals, money magic, and more.',
  openGraph: {
    siteName: 'TheThirteenCoven',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Lets keyboard users jump straight past the header nav. */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <CartProvider>
            <SiteAnalytics />
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
