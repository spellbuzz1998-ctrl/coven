import { NextRequest, NextResponse } from 'next/server'
import { setShopSetting } from '@/lib/db'
import { getRawCommunityPosts, type CommunityPostInput } from '@/lib/community'

export async function GET() {
  return NextResponse.json({ posts: getRawCommunityPosts() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const incoming = Array.isArray(body.posts) ? body.posts : []
  const clean: CommunityPostInput[] = incoming
    .filter((p: unknown): p is CommunityPostInput => {
      const post = p as Record<string, unknown>
      return !!post && typeof post.url === 'string' && ['instagram', 'youtube', 'tiktok'].includes(post.platform as string)
    })
    .map((p: CommunityPostInput) => ({ id: p.id || crypto.randomUUID(), platform: p.platform, url: p.url.trim() }))
    .filter((p: CommunityPostInput) => p.url.length > 0)

  setShopSetting('community_posts', JSON.stringify(clean))
  return NextResponse.json({ ok: true, count: clean.length })
}
