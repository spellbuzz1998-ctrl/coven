import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import CartProvider from '@/components/CartProvider'
import BottomNav from '@/components/BottomNav'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'TheThirteenCoven — Spell Casting & Spiritual Services',
  description: 'Powerful spell casting, psychic readings, and spiritual services by TheThirteenCoven. Love spells, protection rituals, money magic, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
