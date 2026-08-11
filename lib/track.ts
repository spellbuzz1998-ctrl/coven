'use client'

// Client-side interaction tracking.
// Sends a first-party event to our own DB (/api/track) AND mirrors it to
// Google Analytics (gtag) and the Meta Pixel (fbq) when those tags are loaded.

type TrackType = 'pageview' | 'product_view' | 'favorite' | 'add_to_cart' | 'begin_checkout' | 'purchase'

interface TrackProps {
  path?: string
  productSlug?: string
  productTitle?: string
  value?: number
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

const VISITOR_KEY = 'ttc_visitor_id'

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2)}`)
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

export function track(type: TrackType, props: TrackProps = {}) {
  if (typeof window === 'undefined') return

  const payload = {
    type,
    path: props.path ?? window.location.pathname,
    productSlug: props.productSlug,
    productTitle: props.productTitle,
    value: props.value,
    visitorId: getVisitorId(),
    referrer: document.referrer || undefined,
  }

  // 1) First-party: our own dashboard. Prefer sendBeacon so it survives navigation.
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', blob)
    } else {
      fetch('/api/track', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }, keepalive: true })
    }
  } catch {
    /* non-fatal */
  }

  // 2) Google Analytics (GA4)
  if (window.gtag) {
    switch (type) {
      case 'pageview':
        window.gtag('event', 'page_view', { page_path: payload.path })
        break
      case 'product_view':
        window.gtag('event', 'view_item', { items: [{ item_name: props.productTitle, item_id: props.productSlug }] })
        break
      case 'favorite':
        window.gtag('event', 'add_to_wishlist', { items: [{ item_name: props.productTitle, item_id: props.productSlug }] })
        break
      case 'add_to_cart':
        window.gtag('event', 'add_to_cart', { currency: 'USD', value: props.value, items: [{ item_name: props.productTitle, item_id: props.productSlug }] })
        break
      case 'begin_checkout':
        window.gtag('event', 'begin_checkout', { currency: 'USD', value: props.value })
        break
      case 'purchase':
        window.gtag('event', 'purchase', { currency: 'USD', value: props.value })
        break
    }
  }

  // 3) Meta Pixel
  if (window.fbq) {
    switch (type) {
      case 'pageview':
        window.fbq('track', 'PageView')
        break
      case 'product_view':
        window.fbq('track', 'ViewContent', { content_name: props.productTitle, content_ids: props.productSlug ? [props.productSlug] : undefined })
        break
      case 'favorite':
        window.fbq('track', 'AddToWishlist', { content_name: props.productTitle, content_ids: props.productSlug ? [props.productSlug] : undefined })
        break
      case 'add_to_cart':
        window.fbq('track', 'AddToCart', { currency: 'USD', value: props.value, content_name: props.productTitle })
        break
      case 'begin_checkout':
        window.fbq('track', 'InitiateCheckout', { currency: 'USD', value: props.value })
        break
      case 'purchase':
        window.fbq('track', 'Purchase', { currency: 'USD', value: props.value })
        break
    }
  }
}
