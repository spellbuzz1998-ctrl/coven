import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Scoped to the hosts this shop actually serves images from. The previous
    // wildcard let any site's images be proxied through your image optimizer,
    // which others can abuse to run up bandwidth on your account.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.youtube.com https://youtube.com https://www.tiktok.com https://www.instagram.com https://js.stripe.com https://hooks.stripe.com;",
          },
          // Don't leak the full URL (which can contain product//order paths) to
          // third parties when a visitor follows an outbound link.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Stop browsers from guessing a different content type than we send.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Disallow the site being framed by another origin (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
