import ProductCard from './ProductCard'
import type { Product } from '@/lib/products'

interface Props {
  products: Product[]
  saleEndDate?: string | null
  saleDiscount?: number | null
}

export default function ProductGrid({ products, saleEndDate, saleDiscount }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: '#6b6670' }}>
        <p className="text-lg">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p, i) => (
        <div key={p.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
          <ProductCard product={p} saleEndDate={saleEndDate} saleDiscount={saleDiscount} />
        </div>
      ))}
    </div>
  )
}
