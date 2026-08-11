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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://www.facebook.com",
              "font-src 'self'",
              "connect-src 'self' https://api.stripe.com https://*.supabase.co https://res.cloudinary.com https://api.cloudinary.com https://www.google-analytics.com https://www.facebook.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://www.tiktok.com https://www.instagram.com https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
