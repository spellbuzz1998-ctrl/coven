'use client'

import Link from 'next/link'
import { useEffect } from 'react'

// Catches render/data errors anywhere under the root layout so a single broken
// component shows a recoverable message instead of a blank white page.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4" aria-hidden="true">🔮</p>
      <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Something went wrong
      </h1>
      <p className="text-sm mb-8" style={{ color: '#4b5563' }}>
        This part of the site didn&apos;t load properly. Your cart is safe — try again, or head back to the shop.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full font-semibold text-white"
          style={{ backgroundColor: '#1a1040' }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-full font-semibold border-2"
          style={{ borderColor: '#1a1040', color: '#1a1040' }}
        >
          Back to shop
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs mt-8" style={{ color: '#9ca3af' }}>Reference: {error.digest}</p>
      )}
    </div>
  )
}
