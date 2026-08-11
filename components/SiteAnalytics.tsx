'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/track'

// These IDs are interpolated into inline <script> tags below, so they are
// whitelisted to their documented formats. Without this, anything saved in the
// admin analytics fields would execute as JavaScript for every visitor.
const GA4_ID_RE = /^G-[A-Z0-9]{4,20}$/i
const META_PIXEL_ID_RE = /^\d{6,20}$/

// Loads Google Analytics (GA4) + Meta Pixel from the IDs saved in admin,
// and records a first-party pageview on every route change.
export default function SiteAnalytics() {
  const pathname = usePathname()
  const loaded = useRef(false)

  // Load the third-party tags once, based on admin-configured IDs.
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    fetch('/api/analytics-config')
      .then(r => (r.ok ? r.json() : null))
      .then((cfg: { gaId?: string; pixelId?: string } | null) => {
        if (!cfg) return
        if (cfg.gaId && GA4_ID_RE.test(cfg.gaId)) injectGA4(cfg.gaId)
        if (cfg.pixelId && META_PIXEL_ID_RE.test(cfg.pixelId)) injectMetaPixel(cfg.pixelId)
      })
      .catch(() => {
        // Analytics is non-essential — never let it break the page.
      })
  }, [])

  // First-party pageview on initial load + client-side navigations.
  useEffect(() => {
    if (!pathname) return
    // Skip admin pages from analytics noise
    if (pathname.startsWith('/admin')) return
    track('pageview', { path: pathname })
  }, [pathname])

  return null
}

function injectGA4(id: string) {
  if (document.getElementById('ga4-src')) return
  const s = document.createElement('script')
  s.id = 'ga4-src'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)

  const inline = document.createElement('script')
  inline.id = 'ga4-init'
  inline.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${id}', { send_page_view: false });
  `
  document.head.appendChild(inline)
}

function injectMetaPixel(id: string) {
  if (document.getElementById('meta-pixel-init')) return
  const inline = document.createElement('script')
  inline.id = 'meta-pixel-init'
  inline.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${id}');
    fbq('track', 'PageView');
  `
  document.head.appendChild(inline)
}
