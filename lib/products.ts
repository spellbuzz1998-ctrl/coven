import { getDb } from './db'
import { randomUUID } from 'crypto'

export interface ProductVariant {
  name: string
  price: number
  originalPrice?: number
}

export interface Product {
  id: string
  slug: string
  title: string
  description: string
  price: number
  originalPrice?: number
  variants?: ProductVariant[]
  category: string
  images: string[]
  video?: string
  saleEndsAt?: string
  personalizationPrompt?: string
  isDigital: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// A single malformed JSON column would otherwise throw and take down every page
// that lists products, so fall back to an empty array instead.
function parseJsonArray<T>(raw: unknown): T[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    price: row.price as number,
    originalPrice: row.original_price as number | undefined,
    category: row.category as string,
    images: parseJsonArray<string>(row.images),
    video: (row.video as string) || '',
    saleEndsAt: (row.sale_ends_at as string) || undefined,
    variants: parseJsonArray<ProductVariant>(row.variants),
    personalizationPrompt: row.personalization_prompt as string | undefined,
    isDigital: Boolean(row.is_digital),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function getAllProducts(category?: string): Product[] {
  const db = getDb()
  let rows: Record<string, unknown>[]
  if (category && category !== 'All') {
    rows = db.prepare('SELECT * FROM products WHERE is_active = 1 AND category = ? ORDER BY created_at DESC').all(category) as Record<string, unknown>[]
  } else {
    rows = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC').all() as Record<string, unknown>[]
  }
  return rows.map(rowToProduct)
}

export function getProductBySlug(slug: string): Product | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').get(slug) as Record<string, unknown> | undefined
  return row ? rowToProduct(row) : null
}

export function getProductById(id: string): Product | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToProduct(row) : null
}

export function getCategories(): string[] {
  const db = getDb()
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category').all() as { category: string }[]
  return rows.map(r => r.category)
}

export function getRelatedProducts(productId: string, category: string, limit = 6): Product[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 AND category = ? AND id != ? LIMIT ?').all(category, productId, limit) as Record<string, unknown>[]
  return rows.map(rowToProduct)
}

export function searchProducts(query: string): Product[] {
  const db = getDb()
  const like = `%${query}%`
  const rows = db.prepare('SELECT * FROM products WHERE is_active = 1 AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC').all(like, like) as Record<string, unknown>[]
  return rows.map(rowToProduct)
}

export function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO products (id, slug, title, description, price, original_price, variants, category, images, video, sale_ends_at, personalization_prompt, is_digital, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.slug, data.title, data.description, data.price, data.originalPrice ?? null, JSON.stringify(data.variants ?? []), data.category, JSON.stringify(data.images), data.video ?? '', data.saleEndsAt ?? null, data.personalizationPrompt ?? null, data.isDigital ? 1 : 0, data.isActive ? 1 : 0, now, now)
  return getProductById(id)!
}

export function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`
    UPDATE products SET
      slug = COALESCE(?, slug),
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      original_price = ?,
      category = COALESCE(?, category),
      images = COALESCE(?, images),
      video = COALESCE(?, video),
      sale_ends_at = ?,
      variants = COALESCE(?, variants),
      personalization_prompt = ?,
      is_digital = COALESCE(?, is_digital),
      is_active = COALESCE(?, is_active),
      updated_at = ?
    WHERE id = ?
  `).run(
    data.slug ?? null, data.title ?? null, data.description ?? null, data.price ?? null,
    data.originalPrice ?? null,
    data.category ?? null,
    data.images ? JSON.stringify(data.images) : null,
    data.video ?? null,
    data.saleEndsAt ?? null,
    data.variants !== undefined ? JSON.stringify(data.variants) : null,
    data.personalizationPrompt ?? null,
    data.isDigital !== undefined ? (data.isDigital ? 1 : 0) : null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
    now, id
  )
  return getProductById(id)
}

export function deleteProduct(id: string): void {
  const db = getDb()
  db.prepare('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id)
}

export function getTotalProductCount(): number {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
  return row.count
}
