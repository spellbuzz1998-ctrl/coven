// Server-side admin session helpers.
// Uses Web Crypto (available in both Node and Edge runtimes) so the same
// token derivation works in API routes and in middleware.

const SALT = 'ttc-admin-session-v1'

// Server-only. Never read a NEXT_PUBLIC_* variable here — Next.js inlines those
// into the browser bundle, which would publish the admin password to every visitor.
export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null
}

// Constant-time string comparison so an attacker can't learn the password
// one character at a time by measuring how long the check takes.
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  // Compare a fixed number of bytes regardless of input length.
  const len = Math.max(ab.length, bb.length)
  let diff = ab.length ^ bb.length
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return diff === 0
}

export async function adminSessionToken(): Promise<string | null> {
  const password = getAdminPassword()
  if (!password) return null
  const data = new TextEncoder().encode(`${SALT}:${password}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const ADMIN_COOKIE = 'admin_session'
