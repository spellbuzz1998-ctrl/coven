import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'products'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto', // handles images AND videos
          transformation: folder === 'products'
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : undefined,
        },
        (error, result) => {
          if (error || !result) reject(error)
          else resolve(result as { secure_url: string; public_id: string })
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
