'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, HeartIcon, ShareIcon, MinusIcon, PlusIcon, StarIcon, ShieldCheckIcon, TruckIcon, ClockIcon, CheckIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Product, ProductOption } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [options, setOptions] = useState<ProductOption[]>([])
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [mainImage, setMainImage] = useState<string>('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem } = useCartStore()

  // Handle option change and image switching
  const handleOptionChange = (option: ProductOption | null) => {
    setSelectedOption(option)
    // Switch main image based on selected option
    if (option && option.image_url) {
      setMainImage(option.image_url)
    } else if (product) {
      setMainImage(product.image_url || '')
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    setIsLoading(true)
    try {
      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_identifier', params.id)
        .eq('is_active', true)
        .single()

      if (productError) {
        console.error('Error fetching product:', productError)
        toast.error('Product not found')
        router.push('/products')
        return
      }

      setProduct(productData)
      setMainImage(productData.image_url || '')

      // Fetch product options
      const { data: optionsData, error: optionsError } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', productData.id)
        .eq('is_available', true)
        .order('price')

      if (optionsError) {
        console.error('Error fetching options:', optionsError)
      } else {
        setOptions(optionsData || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return

    setIsAddingToCart(true)
    try {
      const name = selectedOption ? `${product.name} - ${selectedOption.option_name}` : product.name
      
      addItem(product, selectedOption || undefined, quantity)
      toast.success(`Added ${name} to cart!`)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  const currentPrice = selectedOption ? selectedOption.price : product?.base_price || 0
  const totalPrice = currentPrice * quantity

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-width section-padding py-8">
          <div className="skeleton h-8 w-32 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="skeleton aspect-square"></div>
            <div className="space-y-6">
              <div className="skeleton h-8 w-3/4"></div>
              <div className="skeleton h-6 w-1/4"></div>
              <div className="skeleton h-24 w-full"></div>
              <div className="skeleton h-32 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-section mb-6">Product Not Found</h1>
          <p className="text-large mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products" className="btn-primary">
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Breadcrumb */}
      <div className="border-b border-neutral-100">
        <div className="container-width section-padding py-4">
          <nav className="flex items-center space-x-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        
        {/* Back Button */}
        <Link 
          href="/products" 
          className="inline-flex items-center text-neutral-600 hover:text-primary-600 mb-8 transition-colors duration-200 hover-lift"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Sticky Product Images */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div className="relative aspect-square bg-neutral-50 overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-neutral-400">No image available</span>
                </div>
              )}
              <div className="product-badge">Premium Quality</div>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="security-badge">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Quality Guaranteed
              </div>
              <div className="trust-badge">
                <TruckIcon className="h-4 w-4 mr-2" />
                Same-Day Available
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="heading-section flex-1 pr-4">
                  {product.name}
                </h1>
                <button
                  onClick={handleFavoriteToggle}
                  className="p-3 hover:bg-neutral-50 transition-colors focus-ring"
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? (
                    <HeartSolidIcon className="h-6 w-6 text-primary-600" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-neutral-600" />
                  )}
                </button>
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < 4 ? 'text-warning-500 fill-current' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-600">(4.8) • 124 reviews</span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="product-price">${currentPrice.toFixed(2)}</span>
                <div className="badge-success">Free delivery $65+</div>
              </div>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="heading-card mb-4">Description</h3>
              <p className="text-body leading-relaxed">
                {product.description || 'A premium handcrafted arrangement made with the freshest ingredients. Perfect for any special occasion or as a thoughtful gift to show you care.'}
              </p>
            </div>

            {/* Product Options - Simple Rectangles (like Edible Arrangements) */}
            {options.length > 0 && (
              <div>
                <h3 className="heading-card mb-4">Choose an Option:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Standard Size Option */}
                  <button
                    onClick={() => handleOptionChange(null)}
                    className={`flex items-center p-3 border transition-all duration-200 ${
                      !selectedOption 
                        ? 'border-primary-600 bg-white ring-2 ring-primary-600' 
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="w-16 h-12 bg-neutral-100 mr-3 flex-shrink-0 relative overflow-hidden">
                      <Image
                        src={product.image_url || 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp'}
                        alt="Standard Size"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm text-neutral-900">Standard</div>
                      <div className="font-bold text-primary-600">${product.base_price.toFixed(2)}</div>
                      <p className="text-xs text-neutral-600">Perfect for most occasions</p>
                    </div>
                  </button>
                  
                  {/* Dynamic Options */}
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionChange(option)}
                      className={`flex items-center p-3 border transition-all duration-200 ${
                        selectedOption?.id === option.id 
                          ? 'border-primary-600 bg-white ring-2 ring-primary-600' 
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-12 bg-neutral-100 mr-3 flex-shrink-0 relative overflow-hidden">
                        <Image
                          src={option.image_url || product.image_url || 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp'}
                          alt={option.option_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm text-neutral-900">{option.option_name}</div>
                        <div className="font-bold text-primary-600">${option.price.toFixed(2)}</div>
                        {option.description && (
                          <p className="text-xs text-neutral-600">{option.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="heading-card mb-4">Quantity</h3>
              <div className="flex items-center justify-between">
                <div className="quantity-selector">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 text-center min-w-[4rem] font-semibold border-x border-neutral-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">Total Price</p>
                  <p className="text-2xl font-bold text-neutral-900">${totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="btn-primary btn-large w-full"
              >
                {isAddingToCart ? (
                  <div className="loading-spinner mx-auto"></div>
                ) : (
                  `Add to Cart • $${totalPrice.toFixed(2)}`
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button className="btn-secondary flex items-center justify-center">
                  <ShareIcon className="h-5 w-5 mr-2" />
                  Share
                </button>
                <Link href="/checkout" className="btn-secondary flex items-center justify-center">
                  Buy Now
                </Link>
              </div>
            </div>

            {/* Delivery & Service Info */}
            <div className="card p-6 space-y-4">
              <h4 className="heading-card">Delivery & Service</h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <TruckIcon className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Same-Day Delivery Available</p>
                    <p className="text-neutral-600">Order by 2PM for same-day delivery</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <ShieldCheckIcon className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Freshness Guarantee</p>
                    <p className="text-neutral-600">100% satisfaction or your money back</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-neutral-900">Handcrafted Fresh</p>
                    <p className="text-neutral-600">Made to order by our skilled artisans</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t border-neutral-200 pt-8">
              <h4 className="heading-card mb-4">Product Details</h4>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-neutral-600 font-medium">Product ID</dt>
                  <dd className="text-neutral-900">{product.product_identifier}</dd>
                </div>
                <div>
                  <dt className="text-neutral-600 font-medium">Delivery</dt>
                  <dd className="text-success-600 font-medium">Same-day available</dd>
                </div>
                <div>
                  <dt className="text-neutral-600 font-medium">Allergen Info</dt>
                  <dd className="text-neutral-900">May contain nuts</dd>
                </div>
                <div>
                  <dt className="text-neutral-600 font-medium">Storage</dt>
                  <dd className="text-neutral-900">Refrigerate upon receipt</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 safe-area-pb overflow-hidden">
        <div className="max-w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-full">
            {/* Quantity Selector - Ultra Compact */}
            <div className="flex items-center border border-neutral-300 bg-white flex-shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 focus:outline-none"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              <span className="px-1 py-1 sm:px-2 sm:py-1 text-center w-6 sm:w-8 font-semibold border-x border-neutral-300 text-xs sm:text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors duration-200 focus:outline-none"
                aria-label="Increase quantity"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>

            {/* Price Display - Compact */}
            <div className="text-center flex-shrink-0">
              <p className="text-xs text-neutral-600 leading-none hidden sm:block">Total</p>
              <p className="text-sm sm:text-base font-bold text-neutral-900 leading-none">${totalPrice.toFixed(2)}</p>
            </div>

            {/* Action Button - Flexible */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex-1 min-w-[70px] max-w-[100px] sm:max-w-[140px] py-2 sm:py-2.5 px-1 sm:px-3 text-xs sm:text-sm"
            >
              {isAddingToCart ? (
                <div className="loading-spinner mx-auto w-4 h-4"></div>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="h-20"></div>

      {/* Note: Floating Chat Button is now handled by the enhanced FloatingChatButton component in AppClientLayout */}
    </div>
  )
} 