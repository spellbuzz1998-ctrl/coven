import { getShopSetting } from './db'

// Central definition of supported social platforms. Add a platform here and it
// automatically appears in the admin editor, footer, and shop header.
export interface SocialPlatform {
  key: string          // internal id + icon lookup
  label: string        // shown in admin
  settingKey: string   // shop_settings key
  placeholder: string  // example URL in admin field
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram', label: 'Instagram', settingKey: 'social_instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', settingKey: 'social_tiktok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'facebook', label: 'Facebook', settingKey: 'social_facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'youtube', label: 'YouTube', settingKey: 'social_youtube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'pinterest', label: 'Pinterest', settingKey: 'social_pinterest', placeholder: 'https://pinterest.com/yourhandle' },
  { key: 'x', label: 'X (Twitter)', settingKey: 'social_x', placeholder: 'https://x.com/yourhandle' },
]

export type SocialLinks = { key: string; label: string; href: string }[]

// Ensure a stored value is a usable absolute URL.
export function normalizeUrl(value: string): string {
  const v = value.trim()
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

// Returns only the platforms the shop owner has actually filled in.
export function getSocialLinks(): SocialLinks {
  const links: SocialLinks = []
  for (const p of SOCIAL_PLATFORMS) {
    const raw = getShopSetting(p.settingKey)
    if (raw && raw.trim()) {
      links.push({ key: p.key, label: p.label, href: normalizeUrl(raw) })
    }
  }
  return links
}
