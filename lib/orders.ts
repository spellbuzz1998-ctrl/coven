import { getDb } from './db'
import { randomUUID } from 'crypto'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  personalization?: string
  productTitle?: string
  productSlug?: string
}

export interface Order {
  id: string
  customerEmail: string
  stripePaymentId?: string
  status: string
  total: number
  couponCode?: string
  discountAmount: number
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
}

export function createOrder(data: {
  customerEmail: string
  total: number
  couponCode?: string
  discountAmount?: number
  items: { productId: string; quantity: number; price: number; personalization?: string }[]
}): Order {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO orders (id, customer_email, status, total, coupon_code, discount_amount, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(id, data.customerEmail, data.total, data.couponCode ?? null, data.discountAmount ?? 0, now, now)

  for (const item of data.items) {
    db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, quantity, price, personalization)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), id, item.productId, item.quantity, item.price, item.personalization ?? null)
  }

  return getOrderById(id)!
}

export function getOrderById(id: string): Order | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return null
  const items = db.prepare(`
    SELECT oi.*, p.title as product_title, p.slug as product_slug
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(id) as Record<string, unknown>[]

  return {
    id: row.id as string,
    customerEmail: row.customer_email as string,
    stripePaymentId: row.stripe_payment_id as string | undefined,
    status: row.status as string,
    total: row.total as number,
    couponCode: row.coupon_code as string | undefined,
    discountAmount: row.discount_amount as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    items: items.map(i => ({
      id: i.id as string,
      orderId: i.order_id as string,
      productId: i.product_id as string,
      quantity: i.quantity as number,
      price: i.price as number,
      personalization: i.personalization as string | undefined,
      productTitle: i.product_title as string | undefined,
      productSlug: i.product_slug as string | undefined,
    })),
  }
}

// Attach the customer's email to a not-yet-paid order. Called while the buyer is
// still on the checkout page, so digital orders can always be delivered even when
// the payment method (PayPal, Klarna, wallets) never hands us an email itself.
export function updateOrderEmail(id: string, email: string): void {
  const db = getDb()
  db.prepare("UPDATE orders SET customer_email = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
    .run(email, new Date().toISOString(), id)
}

// Re-price a pending order in place instead of leaving an orphan row behind
// every time the cart or coupon changes on the checkout page.
export function replacePendingOrder(id: string, data: {
  total: number
  couponCode?: string
  discountAmount?: number
  items: { productId: string; quantity: number; price: number; personalization?: string }[]
}): Order | null {
  const db = getDb()
  const existing = db.prepare("SELECT status FROM orders WHERE id = ?").get(id) as { status: string } | undefined
  if (!existing || existing.status !== 'pending') return null

  const now = new Date().toISOString()
  const tx = db.transaction(() => {
    db.prepare('UPDATE orders SET total = ?, coupon_code = ?, discount_amount = ?, updated_at = ? WHERE id = ?')
      .run(data.total, data.couponCode ?? null, data.discountAmount ?? 0, now, id)
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id)
    for (const item of data.items) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, price, personalization)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), id, item.productId, item.quantity, item.price, item.personalization ?? null)
    }
  })
  tx()
  return getOrderById(id)
}

export function updateOrderPayment(id: string, stripePaymentId: string, status: string): void {
  const db = getDb()
  db.prepare('UPDATE orders SET stripe_payment_id = ?, status = ?, updated_at = ? WHERE id = ?').run(stripePaymentId, status, new Date().toISOString(), id)
}

export function updateOrderStatus(id: string, status: string): void {
  const db = getDb()
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id)
}

export function getAllOrders(): Order[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Record<string, unknown>[]
  return rows.map(row => ({
    id: row.id as string,
    customerEmail: row.customer_email as string,
    stripePaymentId: row.stripe_payment_id as string | undefined,
    status: row.status as string,
    total: row.total as number,
    couponCode: row.coupon_code as string | undefined,
    discountAmount: row.discount_amount as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }))
}

export function getTotalSales(): number {
  const db = getDb()
  const row = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('paid','fulfilled')").get() as { count: number }
  return row.count
}
