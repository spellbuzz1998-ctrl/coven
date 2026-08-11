import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  const fields: string[] = []
  const values: unknown[] = []

  if (body.createdAt !== undefined) {
    fields.push('created_at = ?')
    values.push(body.createdAt)
  }
  if (body.body !== undefined) {
    fields.push('body = ?')
    values.push(body.body)
  }
  if (body.reviewerName !== undefined) {
    fields.push('reviewer_name = ?')
    values.push(body.reviewerName)
  }
  if (body.rating !== undefined) {
    fields.push('rating = ?')
    values.push(body.rating)
  }

  if (fields.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  values.push(id)
  db.prepare(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
