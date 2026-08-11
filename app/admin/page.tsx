import AdminClient from '@/components/AdminClient'
import { getAllProducts } from '@/lib/products'
import { getAllOrders } from '@/lib/orders'
import { getAllReviews } from '@/lib/reviews'
import { adminSessionToken, ADMIN_COOKIE } from '@/lib/adminAuth'
import { cookies } from 'next/headers'

export default async function AdminPage() {
  // Only ship shop data to the browser when the admin session cookie is valid
  const cookieStore = await cookies()
  const expected = await adminSessionToken()
  const authed = !!expected && cookieStore.get(ADMIN_COOKIE)?.value === expected

  const [products, orders, reviews] = authed
    ? await Promise.all([getAllProducts(), getAllOrders(), getAllReviews(100)])
    : [[], [], []]

  return <AdminClient initialAuthed={authed} initialProducts={products} initialOrders={orders} initialReviews={reviews} />
}
