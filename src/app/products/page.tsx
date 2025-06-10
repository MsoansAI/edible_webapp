'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
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
          query = query.order('name')
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

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-neutral-200">
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
                  <span className="capitalize text-neutral-900">{categoryFilter}</span>
                </>
              )}
            </div>
          </nav>

          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="heading-section mb-4">
                {searchQuery ? `Search Results` : 
                 categoryFilter ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Collection` : 
                 'All Products'}
              </h1>
              {searchQuery && (
                <p className="text-large mb-4">
                  Results for <span className="font-semibold">"{searchQuery}"</span>
                </p>
              )}
              <div className="flex items-center gap-4 text-small">
                <span className="font-medium">
                  {totalCount} {totalCount === 1 ? 'product' : 'products'} found
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500"></span>
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
            </button>
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white card p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="heading-card">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden btn-ghost btn-small"
                >
                  Done
                </button>
              </div>
              <ProductFilters categories={categories} />
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-4">
            
            {/* Toolbar */}
            <div className="bg-white card p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                
                {/* Sort & View Options */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-neutral-400" />
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="input-field text-sm min-w-[180px]"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center border border-neutral-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-primary-600 text-white' 
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-primary-600 text-white' 
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <ListBulletIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Results Count & Pagination Info */}
                <div className="text-small text-neutral-500">
                  Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)} of {totalCount}
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(PRODUCTS_PER_PAGE)].map((_, index) => (
                  <div key={index} className="card p-6 space-y-4">
                    <div className="skeleton aspect-square"></div>
                    <div className="skeleton h-6 w-3/4"></div>
                    <div className="skeleton h-4 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      className={viewMode === 'list' ? 'flex flex-row' : ''}
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
                        className="btn-ghost btn-small disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className={`btn-small ${
                              pageNumber === currentPage
                                ? 'btn-primary'
                                : 'btn-ghost'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-ghost btn-small disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white card p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mx-auto mb-6">
                    <FunnelIcon className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="heading-card mb-4">No products found</h3>
                  <p className="text-body mb-8">
                    Try adjusting your search or filter criteria to find what you're looking for.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentPage(1)
                      setSortBy('featured')
                      window.history.pushState({}, '', '/products')
                      fetchProducts()
                    }}
                    className="btn-primary"
                  >
                    Clear All Filters
                  </button>
                </div>
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
      <div className="min-h-screen bg-neutral-50">
        <div className="container-width section-padding py-8">
          <div className="skeleton h-12 w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="card p-6 space-y-4">
                <div className="skeleton aspect-square"></div>
                <div className="skeleton h-6 w-3/4"></div>
                <div className="skeleton h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
} 