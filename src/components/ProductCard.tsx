'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCartIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Product } from '@/types/database'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
  viewMode?: 'grid' | 'list'
}

export default function ProductCard({ product, onAddToCart, className = '', viewMode = 'grid' }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!onAddToCart || isLoading) return
    
    setIsLoading(true)
    try {
      await onAddToCart(product)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const imageUrl = product.image_url || 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp'

  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200 ${className}`}>
        <Link href={`/products/${product.product_identifier}`} className="block">
          <div className="flex flex-col sm:flex-row gap-4 p-4">
            
            {/* Product Image - List Mode */}
            <div className="relative w-full sm:w-48 aspect-square sm:aspect-square bg-neutral-50 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 192px"
              />
              
              {/* Favorite Button - List Mode */}
              <button
                onClick={handleFavoriteToggle}
                className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110"
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorited ? (
                  <HeartSolidIcon className="h-4 w-4 text-primary-600" />
                ) : (
                  <HeartIcon className="h-4 w-4 text-neutral-600 hover:text-primary-600" />
                )}
              </button>
            </div>

            {/* Product Info - List Mode */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="space-y-3">
                
                {/* Rating & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3 w-3 ${
                          i < 4 ? 'text-warning-500 fill-current' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs ml-2 text-neutral-600">(4.8)</span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Same Day
                  </div>
                </div>

                {/* Product Name & Description */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 hover:text-primary-600 transition-colors duration-200 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-neutral-600 line-clamp-3 mt-2">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                    Fresh Guaranteed
                  </span>
                  <span>Free delivery $65+</span>
                </div>
              </div>

              {/* Price & Actions - List Mode */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <div>
                  <span className="text-xl font-semibold text-neutral-900">
                    {formatPrice(product.base_price)}
                  </span>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="btn-primary btn-small"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" />
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Grid Mode (Default)
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 group ${className}`}>
      <Link href={`/products/${product.product_identifier}`} className="block">
        
        {/* Product Image - Grid Mode */}
        <div className="relative aspect-square bg-neutral-50 rounded-t-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Favorite Button - Grid Mode */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? (
              <HeartSolidIcon className="h-4 w-4 text-primary-600" />
            ) : (
              <HeartIcon className="h-4 w-4 text-neutral-600 hover:text-primary-600" />
            )}
          </button>

          {/* Quick Add Overlay - Grid Mode */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="btn-primary btn-small w-full transition-transform duration-200 transform translate-y-2 group-hover:translate-y-0"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto" />
              ) : (
                <>
                  <ShoppingCartIcon className="h-4 w-4 mr-2" />
                  Quick Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Info - Grid Mode */}
        <div className="p-4 space-y-3">
          
          {/* Rating & Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-3 w-3 ${
                    i < 4 ? 'text-warning-500 fill-current' : 'text-neutral-300'
                  }`}
                />
              ))}
              <span className="text-xs ml-2 text-neutral-600">(4.8)</span>
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
              Same Day
            </div>
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-base font-semibold text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-neutral-600 line-clamp-2 mt-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-neutral-900">
              {formatPrice(product.base_price)}
            </span>
          </div>

          {/* Trust Indicators */}
          <div className="pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                <span className="hidden sm:inline">Fresh Guaranteed</span>
                <span className="sm:hidden">Fresh</span>
              </span>
              <span className="hidden sm:inline">Free delivery $65+</span>
              <span className="sm:hidden">Free $65+</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
} 