import { getAllProducts, getCategories } from '@/lib/products'
import { getAllReviews, getShopStats } from '@/lib/reviews'
import { getTotalSales } from '@/lib/orders'
import ShopHero from '@/components/ShopHero'
import ProductGrid from '@/components/ProductGrid'
import ReviewsList from '@/components/ReviewsList'
import ShopTabs from '@/components/ShopTabs'

interface SearchParams {
  tab?: string
  category?: string
  q?: string
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const tab = sp.tab ?? 'items'
  const category = sp.category
  const query = sp.q

  const [stats, reviews, sales] = await Promise.all([
    getShopStats(),
    getAllReviews(50),
    getTotalSales(),
  ])

  return (
    <div>
      <ShopHero
        reviewCount={stats.reviewCount}
        averageRating={stats.averageRating}
        salesCount={sales + 847}
      />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <ShopTabs
          activeTab={tab}
          category={category}
          query={query}
          reviews={reviews}
          reviewCount={stats.reviewCount}
          averageRating={stats.averageRating}
        />
      </div>
    </div>
  )
}
