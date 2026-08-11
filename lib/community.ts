import { getShopSetting } from './db'

export type CommunityPlatform = 'instagram' | 'youtube' | 'tiktok'

export interface CommunityPostInput {
  id: string
  platform: CommunityPlatform
  url: string
}

export interface CommunityPost extends CommunityPostInput {
  embedUrl: string
  aspect: 'video' | 'portrait'
}

const SETTING_KEY = 'community_posts'

// Extract the platform-specific embeddable URL from a normal post/video link.
export function toEmbedUrl(platform: CommunityPlatform, url: string): { embedUrl: string; aspect: 'video' | 'portrait' } | null {
  const u = url.trim()
  if (!u) return null

  if (platform === 'youtube') {
    const m = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (!m) return null
    return { embedUrl: `https://www.youtube.com/embed/${m[1]}`, aspect: 'video' }
  }

  if (platform === 'tiktok') {
    const m = u.match(/tiktok\.com\/(?:.*\/video\/|embed\/v2\/)(\d+)/)
    if (!m) return null
    return { embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}`, aspect: 'portrait' }
  }

  if (platform === 'instagram') {
    const m = u.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
    if (!m) return null
    return { embedUrl: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, aspect: 'portrait' }
  }

  return null
}

export function getRawCommunityPosts(): CommunityPostInput[] {
  const raw = getShopSetting(SETTING_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is CommunityPostInput =>
        p && typeof p.url === 'string' && ['instagram', 'youtube', 'tiktok'].includes(p.platform)
    )
  } catch {
    return []
  }
}

// Returns only posts whose URL we could turn into a valid embed.
export function getCommunityPosts(): CommunityPost[] {
  const posts: CommunityPost[] = []
  for (const p of getRawCommunityPosts()) {
    const embed = toEmbedUrl(p.platform, p.url)
    if (embed) posts.push({ ...p, ...embed })
  }
  return posts
}
