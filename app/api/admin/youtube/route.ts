import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getOAuthClient, getTokens, hasTokens } from '@/lib/youtube'
import { Readable } from 'stream'

// GET /api/admin/youtube — check connection status
export async function GET() {
  return NextResponse.json({ connected: hasTokens() })
}

// POST /api/admin/youtube — upload video to YouTube as unlisted
export async function POST(req: NextRequest) {
  if (!hasTokens()) {
    return NextResponse.json({ error: 'YouTube not connected. Please connect first.' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = (formData.get('title') as string) || 'Product Video'
    const description = (formData.get('description') as string) || 'ThirteenCoven product video'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(getTokens()!)

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const stream = Readable.from(buffer)

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: ['ThirteenCoven', 'spell', 'reading', 'spiritual'],
        },
        status: {
          privacyStatus: 'unlisted',
        },
      },
      media: {
        mimeType: file.type || 'video/mp4',
        body: stream,
      },
    })

    const videoId = response.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    return NextResponse.json({ videoId, videoUrl, embedUrl: `https://www.youtube.com/embed/${videoId}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('YouTube upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
