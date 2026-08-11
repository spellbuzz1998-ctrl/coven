import { NextRequest, NextResponse } from 'next/server'
import { getAllArticles, createArticle, updateArticle, deleteArticle } from '@/lib/articles'

export async function GET() {
  const articles = getAllArticles()
  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'create') {
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    const article = createArticle({
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() ?? '',
      body: body.body ?? '',
      coverImage: body.coverImage ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      isPublished: body.isPublished ?? false,
    })
    return NextResponse.json({ article })
  }

  if (action === 'update') {
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const article = updateArticle(body.id, {
      title: body.title?.trim(),
      excerpt: body.excerpt?.trim(),
      body: body.body,
      coverImage: body.coverImage,
      tags: body.tags,
      metaTitle: body.metaTitle?.trim(),
      metaDescription: body.metaDescription?.trim(),
      isPublished: body.isPublished,
    })
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ article })
  }

  if (action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    deleteArticle(body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
