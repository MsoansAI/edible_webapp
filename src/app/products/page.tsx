'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { FunnelIcon, Squares2X2Icon, ListBulletIcon, ChevronDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('featured')
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()
  const productsHeaderRef = useRef<HTMLDivElement>(null)
  
  const PRODUCTS_PER_PAGE = 12

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get category filter first
      const categoryFilter = searchParams.get('category')
      let productIds: string[] = []
      
      // If category filter is applied, get product IDs for that category
      if (categoryFilter) {
        try {
          // Get category ID
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('name', categoryFilter)
            .single()
          
          if (categoryError || !categoryData) {
            console.warn(`Category "${categoryFilter}" not found`)
          } else {
            // Get product IDs in this category
            const { data: productCategoryData, error: productCategoryError } = await supabase
              .from('product_categories')
              .select('product_id')
              .eq('category_id', categoryData.id)
            
            if (productCategoryError) {
              console.error('Error fetching product categories:', productCategoryError)
            } else {
              productIds = productCategoryData?.map(pc => pc.product_id) || []
            }
          }
        } catch (error) {
          console.error('Error in category filtering:', error)
        }
      }

      // Build main products query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // Apply category filter if we have product IDs
      if (categoryFilter && productIds.length > 0) {
        query = query.in('id', productIds)
      } else if (categoryFilter && productIds.length === 0) {
        // Category exists but has no products - return empty result
        setProducts([])
        setTotalCount(0)
        setIsLoading(false)
        return
      }

      // Apply search filter
      const searchQuery = searchParams.get('search')
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
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

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('base_price', { ascending: true })
          break
        case 'price-high':
          query = query.order('base_price', { ascending: false })
          break
        case 'name-asc':
          query = query.order('name', { ascending: true })
          break
        case 'name-desc':
          query = query.order('name', { ascending: false })
          break
        default:
          // For featured, we can order by a combination of factors
          query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const offset = (currentPage - 1) * PRODUCTS_PER_PAGE
      query = query.range(offset, offset + PRODUCTS_PER_PAGE - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
      } else {
        setProducts(data || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, currentPage, sortBy])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
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

  // Reset page when search params change (except page)
  useEffect(() => {
    const page = searchParams.get('page')
    if (page) {
      setCurrentPage(parseInt(page))
    } else {
      setCurrentPage(1)
    }
  }, [searchParams])

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE)
  const searchQuery = searchParams.get('search')
  const categoryFilter = searchParams.get('category')

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
  ]

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    window.history.pushState({}, '', `/products?${params.toString()}`)
    setCurrentPage(page)
    
    // Scroll to top of products section
    if (productsHeaderRef.current) {
      productsHeaderRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header Banner */}
      <div ref={productsHeaderRef} className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding section-spacing">
          
          {/* Breadcrumb */}
          <nav className="text-sm text-neutral-500 mb-6">
            <div className="flex items-center space-x-2">
              <span>Home</span>
              <span>/</span>
              <span>Products</span>
              {categoryFilter && (
                <>
                  <span>/</span>
                  <span className="text-neutral-900 font-medium">{categoryFilter}</span>
                </>
              )}
            </div>
          </nav>

          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="heading-section mb-4">
                {searchQuery ? `Search Results` : 
                 categoryFilter ? `${categoryFilter} Collection` : 
                 'All Products'}
              </h1>
              {searchQuery && (
                <p className="text-large mb-4">
                  Results for <span className="font-semibold text-primary-600">"{searchQuery}"</span>
                </p>
              )}
              <div className="flex items-center gap-4 text-small">
                <span className="font-medium">
                  {isLoading ? 'Loading...' : `${totalCount} ${totalCount === 1 ? 'product' : 'products'} found`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                  <span>Free delivery on orders $65+</span>
                </div>
              </div>
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn-secondary flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters & Sort
              {(searchParams.get('category') || searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Active
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters categories={categories} totalCount={totalCount} />
            </div>
          </div>
          
          {/* Mobile Filters Overlay */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowFilters(false)}>
              <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                  <ProductFilters categories={categories} totalCount={totalCount} />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-neutral-400'}`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-neutral-400'}`}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <span className="text-sm text-neutral-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-8 w-48"></div>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
                }>
                  {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                    <div key={i} className="skeleton aspect-square"></div>
                  ))}
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No products found</h3>
                <p className="text-neutral-600 mb-6">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/products')
                    window.location.reload()
                  }}
                  className="btn-primary"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                  : "space-y-6 mb-12"
                }>
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary btn-small disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i
                      if (pageNum > totalPages) return null
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`btn-small ${
                            pageNum === currentPage 
                              ? 'btn-primary' 
                              : 'btn-secondary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="btn-secondary btn-small disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
} 