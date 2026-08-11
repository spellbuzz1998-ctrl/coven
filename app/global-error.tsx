'use client'

import { useEffect } from 'react'

// Last-resort boundary: catches errors thrown by the root layout itself, which
// app/error.tsx cannot reach. It must render its own <html> and <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f5f0e8', color: '#1a1040', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🔮</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 12 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 32 }}>
            The site hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#1a1040',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
