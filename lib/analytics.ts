import { getDb } from './db'

export type EventType = 'pageview' | 'product_view' | 'favorite' | 'add_to_cart' | 'begin_checkout' | 'purchase'

export interface RecordEventInput {
  type: EventType
  path?: string
  productSlug?: string
  productTitle?: string
  value?: number
  visitorId?: string
  referrer?: string
}

const VALID_TYPES: EventType[] = ['pageview', 'product_view', 'favorite', 'add_to_cart', 'begin_checkout', 'purchase']

export function recordEvent(input: RecordEventInput): boolean {
  if (!VALID_TYPES.includes(input.type)) return false
  const db = getDb()
  db.prepare(
    `INSERT INTO analytics_events (type, path, product_slug, product_title, value, visitor_id, referrer)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    input.type,
    input.path ?? null,
    input.productSlug ?? null,
    input.productTitle ?? null,
    typeof input.value === 'number' && isFinite(input.value) ? input.value : null,
    input.visitorId ?? null,
    input.referrer ?? null
  )
  return true
}

export interface AnalyticsSummary {
  range: string
  days: number
  totals: {
    visitors: number
    pageviews: number
    productViews: number
    favorites: number
    addToCart: number
    checkouts: number
    purchases: number
    revenue: number
    conversionRate: number
  }
  timeseries: { date: string; pageviews: number; purchases: number }[]
  topProducts: { title: string; slug: string | null; views: number }[]
  topFavorited: { title: string; slug: string | null; count: number }[]
  recentPurchases: { title: string | null; value: number; createdAt: string }[]
}

const RANGE_DAYS: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 }

export function getAnalyticsSummary(range = '7d'): AnalyticsSummary {
  const db = getDb()
  const days = RANGE_DAYS[range] ?? 7
  // SQLite datetime comparison against ISO-ish 'now' offset
  const since = `datetime('now', '-${days} days')`

  const count = (where: string) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM analytics_events WHERE created_at >= ${since} AND ${where}`).get() as { n: number }).n

  const visitors = (db
    .prepare(`SELECT COUNT(DISTINCT visitor_id) AS n FROM analytics_events WHERE created_at >= ${since} AND visitor_id IS NOT NULL`)
    .get() as { n: number }).n

  const pageviews = count(`type = 'pageview'`)
  const productViews = count(`type = 'product_view'`)
  const favorites = count(`type = 'favorite'`)
  const addToCart = count(`type = 'add_to_cart'`)
  const checkouts = count(`type = 'begin_checkout'`)
  const purchases = count(`type = 'purchase'`)

  const revenue = (db
    .prepare(`SELECT COALESCE(SUM(value), 0) AS s FROM analytics_events WHERE created_at >= ${since} AND type = 'purchase'`)
    .get() as { s: number }).s

  const conversionRate = visitors > 0 ? Math.round((purchases / visitors) * 1000) / 10 : 0

  // Daily timeseries (pageviews + purchases)
  const rows = db
    .prepare(
      `SELECT date(created_at) AS d,
              SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pv,
              SUM(CASE WHEN type = 'purchase' THEN 1 ELSE 0 END) AS pu
       FROM analytics_events
       WHERE created_at >= ${since}
       GROUP BY date(created_at)
       ORDER BY d ASC`
    )
    .all() as { d: string; pv: number; pu: number }[]

  // Build a continuous series so the chart has no gaps
  const byDate = new Map(rows.map(r => [r.d, r]))
  const timeseries: { date: string; pageviews: number; purchases: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000)
    const key = dt.toISOString().slice(0, 10)
    const r = byDate.get(key)
    timeseries.push({ date: key, pageviews: r?.pv ?? 0, purchases: r?.pu ?? 0 })
  }

  const topProducts = db
    .prepare(
      `SELECT product_title AS title, product_slug AS slug, COUNT(*) AS views
       FROM analytics_events
       WHERE created_at >= ${since} AND type = 'product_view' AND product_title IS NOT NULL
       GROUP BY product_title
       ORDER BY views DESC
       LIMIT 8`
    )
    .all() as { title: string; slug: string | null; views: number }[]

  const topFavorited = db
    .prepare(
      `SELECT product_title AS title, product_slug AS slug, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at >= ${since} AND type = 'favorite' AND product_title IS NOT NULL
       GROUP BY product_title
       ORDER BY count DESC
       LIMIT 8`
    )
    .all() as { title: string; slug: string | null; count: number }[]

  const recentPurchases = db
    .prepare(
      `SELECT product_title AS title, COALESCE(value, 0) AS value, created_at AS createdAt
       FROM analytics_events
       WHERE type = 'purchase'
       ORDER BY created_at DESC
       LIMIT 10`
    )
    .all() as { title: string | null; value: number; createdAt: string }[]

  return {
    range,
    days,
    totals: { visitors, pageviews, productViews, favorites, addToCart, checkouts, purchases, revenue, conversionRate },
    timeseries,
    topProducts,
    topFavorited,
    recentPurchases,
  }
}
