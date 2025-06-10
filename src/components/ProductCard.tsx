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
}

export default function ProductCard({ product, onAddToCart, className = '' }: ProductCardProps) {
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

  return (
    <div className={`card-product group ${className}`}>
      <Link href={`/products/${product.product_identifier}`} className="block">
        
        {/* Product Image */}
        <div className="relative aspect-square bg-neutral-50 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? (
              <HeartSolidIcon className="h-5 w-5 text-primary-600" />
            ) : (
              <HeartIcon className="h-5 w-5 text-neutral-600 hover:text-primary-600" />
            )}
          </button>

          {/* Quick Add Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center p-6 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className="btn-primary btn-small w-full transition-transform duration-200 transform translate-y-4 group-hover:translate-y-0"
            >
              {isLoading ? (
                <div className="loading-spinner mx-auto" />
              ) : (
                <>
                  <ShoppingCartIcon className="h-4 w-4 mr-2" />
                  Quick Add
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
          
          {/* Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    i < 4 ? 'text-warning-500 fill-current' : 'text-neutral-300'
                  }`}
                />
              ))}
              <span className="text-xs sm:text-sm ml-1 sm:ml-2 text-neutral-600">(4.8)</span>
            </div>
            <div className="badge-success text-xs sm:text-sm">
              Same Day
            </div>
          </div>

          {/* Product Name */}
          <div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 mt-1 sm:mt-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-semibold text-neutral-900">
                {formatPrice(product.base_price)}
              </span>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-3 sm:pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-500">
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success-500 mr-1 sm:mr-2"></span>
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