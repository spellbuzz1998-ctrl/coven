import { getDb } from './db'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  coverImage: string | null
  tags: string[]
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  cover_image: string | null
  tags: string
  meta_title: string | null
  meta_description: string | null
  is_published: number
  published_at: string | null
  created_at: string
  updated_at: string
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.cover_image,
    tags: JSON.parse(row.tags || '[]'),
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isPublished: row.is_published === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function getPublishedArticles(limit = 50): Article[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT * FROM articles WHERE is_published = 1 AND published_at IS NOT NULL
       ORDER BY published_at DESC LIMIT ?`
    )
    .all(limit) as ArticleRow[]
  return rows.map(rowToArticle)
}

export function getAllArticles(): Article[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM articles ORDER BY created_at DESC')
    .all() as ArticleRow[]
  return rows.map(rowToArticle)
}

export function getArticleBySlug(slug: string): Article | null {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM articles WHERE slug = ?')
    .get(slug) as ArticleRow | undefined
  return row ? rowToArticle(row) : null
}

export function getArticleById(id: string): Article | null {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM articles WHERE id = ?')
    .get(id) as ArticleRow | undefined
  return row ? rowToArticle(row) : null
}

export interface ArticleInput {
  title: string
  excerpt: string
  body: string
  coverImage?: string | null
  tags?: string[]
  metaTitle?: string | null
  metaDescription?: string | null
  isPublished?: boolean
}

export function createArticle(input: ArticleInput): Article {
  const db = getDb()
  const id = crypto.randomUUID()
  let slug = slugify(input.title)
  const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug)
  if (existing) slug = `${slug}-${Date.now().toString(36)}`
  const now = new Date().toISOString()
  const isPublished = input.isPublished ? 1 : 0
  const publishedAt = isPublished ? now : null

  db.prepare(
    `INSERT INTO articles (id, slug, title, excerpt, body, cover_image, tags, meta_title, meta_description, is_published, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, slug, input.title, input.excerpt, input.body,
    input.coverImage ?? null, JSON.stringify(input.tags ?? []),
    input.metaTitle ?? null, input.metaDescription ?? null,
    isPublished, publishedAt, now, now
  )
  return getArticleById(id)!
}

export function updateArticle(id: string, input: Partial<ArticleInput>): Article | null {
  const db = getDb()
  const existing = getArticleById(id)
  if (!existing) return null

  const now = new Date().toISOString()
  const isPublished = input.isPublished !== undefined ? (input.isPublished ? 1 : 0) : (existing.isPublished ? 1 : 0)
  let publishedAt = existing.publishedAt
  if (isPublished && !publishedAt) publishedAt = now
  if (!isPublished) publishedAt = null

  let slug = existing.slug
  if (input.title && input.title !== existing.title) {
    const newSlug = slugify(input.title)
    const conflict = db.prepare('SELECT id FROM articles WHERE slug = ? AND id != ?').get(newSlug, id)
    slug = conflict ? `${newSlug}-${Date.now().toString(36)}` : newSlug
  }

  db.prepare(
    `UPDATE articles SET slug=?, title=?, excerpt=?, body=?, cover_image=?, tags=?,
     meta_title=?, meta_description=?, is_published=?, published_at=?, updated_at=?
     WHERE id=?`
  ).run(
    slug,
    input.title ?? existing.title,
    input.excerpt ?? existing.excerpt,
    input.body ?? existing.body,
    input.coverImage !== undefined ? input.coverImage : existing.coverImage,
    JSON.stringify(input.tags ?? existing.tags),
    input.metaTitle !== undefined ? input.metaTitle : existing.metaTitle,
    input.metaDescription !== undefined ? input.metaDescription : existing.metaDescription,
    isPublished, publishedAt, now, id
  )
  return getArticleById(id)
}

export function deleteArticle(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(id)
  return result.changes > 0
}
