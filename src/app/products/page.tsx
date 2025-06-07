'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { Product, Category } from '@/types/database'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import ProductFilters from '@/components/ProductFilters'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()
  
  const PRODUCTS_PER_PAGE = 12

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Apply search filter
      const searchQuery = searchParams.get('search')
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }

      // Apply category filter
      const categoryFilter = searchParams.get('category')
      if (categoryFilter) {
        // This would need a join with product_categories table in a real implementation
        // For now, we'll filter by product name containing category keywords
        const categoryKeywords = {
          'arrangements': 'arrangement',
          'chocolate': 'chocolate',
          'occasion': 'birthday|anniversary|valentine|mother',
        }
        
        const keyword = categoryKeywords[categoryFilter as keyof typeof categoryKeywords]
        if (keyword) {
          query = query.ilike('name', `%${keyword}%`)
        }
      }

      // Apply price range filter
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      if (minPrice) {
        query = query.gte('base_price', parseFloat(minPrice))
      }
      if (maxPrice) {
        query = query.lte('base_price', parseFloat(maxPrice))
      }

      // Apply pagination
      const offset = (currentPage - 1) * PRODUCTS_PER_PAGE
      query = query.range(offset, offset + PRODUCTS_PER_PAGE - 1)

      // Order by name
      query = query.order('name')

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, currentPage])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)
  const searchQuery = searchParams.get('search')
  const categoryFilter = searchParams.get('category')

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <div className="min-h-screen bg-white">
      
      <div className="container-width section-padding py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">
                {searchQuery ? `Search Results for "${searchQuery}"` : 
                 categoryFilter ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Products` : 
                 'All Products'}
              </h1>
              <p className="text-gray-600 mt-2">
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </p>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn-secondary flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
          
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span>Products</span>
            {categoryFilter && (
              <>
                <span className="mx-2">/</span>
                <span className="capitalize">{categoryFilter}</span>
              </>
            )}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <ProductFilters categories={categories} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Sort Options - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
                <select className="input-field text-sm flex-1 sm:flex-none">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Name: A to Z</option>
                  <option>Name: Z to A</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-500 text-center sm:text-right">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(PRODUCTS_PER_PAGE)].map((_, index) => (
                  <div key={index} className="card p-6">
                    <div className="w-full h-48 bg-gray-200 rounded-lg shimmer mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded shimmer mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded shimmer w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        const pageNumber = Math.max(1, currentPage - 2) + index
                        if (pageNumber > totalPages) return null
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNumber === currentPage
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FunnelIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => {
                    setCurrentPage(1)
                    window.history.pushState({}, '', '/products')
                    fetchProducts()
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <div className="container-width section-padding py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card p-6">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
} 