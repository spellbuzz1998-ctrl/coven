import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'shop.db')

let _db: Database.Database | null = null

export function getShopSetting(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM shop_settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setShopSetting(key: string, value: string): void {
  const db = getDb()
  db.prepare(`INSERT INTO shop_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(key, value, new Date().toISOString())
}

// Shop-wide sale, only while it hasn't ended. Single source of truth for
// both the storefront display and server-side price calculation.
export function getActiveSale(): { saleDiscount: number | null; saleEndDate: string | null } {
  const saleEndDate = getShopSetting('shop_sale_end_date')
  const saleDiscountStr = getShopSetting('shop_sale_discount')
  let saleDiscount = saleDiscountStr ? parseFloat(saleDiscountStr) : null
  if (!(saleDiscount && saleDiscount > 0 && saleDiscount < 100)) saleDiscount = null
  if (saleDiscount && saleEndDate) {
    const end = new Date(saleEndDate)
    end.setHours(23, 59, 59, 999)
    if (Date.now() > end.getTime()) saleDiscount = null
  }
  return { saleDiscount, saleEndDate: saleDiscount ? saleEndDate : null }
}

export function getDb(): Database.Database {
  if (!_db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      personalization_prompt TEXT,
      is_digital INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Safe migrations
  const cols = db.prepare("PRAGMA table_info(products)").all() as { name: string }[]
  if (!cols.find(c => c.name === 'variants')) {
    db.exec(`ALTER TABLE products ADD COLUMN variants TEXT NOT NULL DEFAULT '[]'`)
  }
  if (!cols.find(c => c.name === 'video')) {
    db.exec(`ALTER TABLE products ADD COLUMN video TEXT NOT NULL DEFAULT ''`)
  }
  if (!cols.find(c => c.name === 'sale_ends_at')) {
    db.exec(`ALTER TABLE products ADD COLUMN sale_ends_at TEXT`)
  }

  db.exec(`

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_email TEXT NOT NULL,
      stripe_payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL,
      coupon_code TEXT,
      discount_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL,
      personalization TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      reviewer_name TEXT NOT NULL,
      reviewer_avatar TEXT,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL,
      seller_response TEXT,
      purchased_item TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      amount REAL NOT NULL,
      description TEXT,
      offer_type TEXT NOT NULL DEFAULT 'promo_code',
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      min_order_amount REAL,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shop_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      cover_image TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      meta_title TEXT,
      meta_description TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      path TEXT,
      product_slug TEXT,
      product_title TEXT,
      value REAL,
      visitor_id TEXT,
      referrer TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
      unsubscribed_at TEXT
    );
  `)

  // Safe migrations for coupons table (must run after the table exists)
  const couponCols = db.prepare("PRAGMA table_info(coupons)").all() as { name: string }[]
  if (!couponCols.find(c => c.name === 'description')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN description TEXT`)
  }
  if (!couponCols.find(c => c.name === 'offer_type')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN offer_type TEXT NOT NULL DEFAULT 'promo_code'`)
  }
  if (!couponCols.find(c => c.name === 'usage_limit')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN usage_limit INTEGER`)
  }
  if (!couponCols.find(c => c.name === 'used_count')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN used_count INTEGER NOT NULL DEFAULT 0`)
  }
  if (!couponCols.find(c => c.name === 'min_order_amount')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN min_order_amount REAL`)
  }
  if (!couponCols.find(c => c.name === 'expires_at')) {
    db.exec(`ALTER TABLE coupons ADD COLUMN expires_at TEXT`)
  }
}
