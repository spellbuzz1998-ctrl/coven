import { getDb } from './db'
import { randomUUID } from 'crypto'

export interface Review {
  id: string
  productId?: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  body: string
  sellerResponse?: string
  purchasedItem?: string
  createdAt: string
}

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    productId: row.product_id as string | undefined,
    reviewerName: row.reviewer_name as string,
    reviewerAvatar: row.reviewer_avatar as string | undefined,
    rating: row.rating as number,
    body: row.body as string,
    sellerResponse: row.seller_response as string | undefined,
    purchasedItem: row.purchased_item as string | undefined,
    createdAt: row.created_at as string,
  }
}

export function getAllReviews(limit = 50): Review[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?').all(limit) as Record<string, unknown>[]
  return rows.map(rowToReview)
}

export function getReviewsForProduct(productId: string): Review[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(productId) as Record<string, unknown>[]
  return rows.map(rowToReview)
}

export function getShopStats() {
  const db = getDb()
  const countRow = db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number }
  const avgRow = db.prepare('SELECT AVG(rating) as avg FROM reviews').get() as { avg: number | null }
  return {
    reviewCount: countRow.count,
    averageRating: avgRow.avg ? Math.round(avgRow.avg * 10) / 10 : 4.8,
  }
}

export function createReview(data: Omit<Review, 'id' | 'createdAt'>): Review {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO reviews (id, product_id, reviewer_name, reviewer_avatar, rating, body, seller_response, purchased_item, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.productId ?? null, data.reviewerName, data.reviewerAvatar ?? null, data.rating, data.body, data.sellerResponse ?? null, data.purchasedItem ?? null, now)
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Record<string, unknown>
  return rowToReview(row)
}

export function deleteReview(id: string): void {
  const db = getDb()
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id)
}
