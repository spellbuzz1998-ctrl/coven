import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4" aria-hidden="true">🌙</p>
      <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
        Page not found
      </h1>
      <p className="text-sm mb-8" style={{ color: '#4b5563' }}>
        This page doesn&apos;t exist, or the listing may have been removed.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded-full font-semibold text-white"
        style={{ backgroundColor: '#1a1040' }}
      >
        Browse the shop
      </Link>
    </div>
  )
}
