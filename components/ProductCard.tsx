import Link from 'next/link'
import Image from 'next/image'
import { Star, CloudDownload } from 'lucide-react'
import type { Product } from '@/lib/products'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const image = product.images[0] || '/images/placeholder.jpg'

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col">
      {/* Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
        <Image
          src={image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount && (
          <div
            className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: '#d4760a' }}
          >
            {discount}% off
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col">
        <p className="text-xs mb-1" style={{ color: '#6b6670' }}>TheThirteenCoven</p>
        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: '#1a1040' }}>
          {product.title}
        </p>

        {/* Stars placeholder */}
        <div className="flex items-center gap-0.5 mb-1">
          {[1,2,3,4,5].map(n => (
            <Star key={n} size={10} className="fill-yellow-500 text-yellow-500" />
          ))}
          <span className="text-xs ml-1" style={{ color: '#6b6670' }}>(5.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-bold text-base" style={{ color: '#1a1040' }}>
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs line-through" style={{ color: '#6b6670' }}>
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Digital badge */}
        {product.isDigital && (
          <div className="flex items-center gap-1 mt-1" style={{ color: '#6b6670' }}>
            <CloudDownload size={11} />
            <span className="text-xs">Digital download</span>
          </div>
        )}
      </div>
    </Link>
  )
}
