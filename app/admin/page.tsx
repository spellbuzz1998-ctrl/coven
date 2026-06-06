import AdminClient from '@/components/AdminClient'
import { getAllProducts } from '@/lib/products'
import { getAllOrders } from '@/lib/orders'
import { getAllReviews } from '@/lib/reviews'

export default async function AdminPage() {
  const [products, orders, reviews] = await Promise.all([
    getAllProducts(),
    getAllOrders(),
    getAllReviews(100),
  ])

  return <AdminClient initialProducts={products} initialOrders={orders} initialReviews={reviews} />
}
