'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, HeartIcon, ShareIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
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
  const { addItem } = useCartStore()

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
        .eq('is_active', true)
        .order('price')

      if (optionsError) {
        console.error('Error fetching options:', optionsError)
      } else {
        setOptions(optionsData || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    const price = selectedOption ? selectedOption.price : product.base_price
    const name = selectedOption ? `${product.name} - ${selectedOption.option_name}` : product.name

    addItem(product, selectedOption || undefined, quantity)

    toast.success(`Added ${name} to cart!`)
  }

  const currentPrice = selectedOption ? selectedOption.price : product?.base_price || 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-width section-padding py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-width section-padding py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/products" className="btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      
      <div className="container-width section-padding py-6 sm:py-8">
        {/* Back Button */}
        <Link 
          href="/products" 
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {/* Additional images would go here */}
            <div className="grid grid-cols-4 gap-2">
              {/* Placeholder for additional product images */}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-display mb-2">
                {product.name}
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-primary-600">
                ${currentPrice.toFixed(2)}
              </p>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Product Options */}
            {options.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Options</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setSelectedOption(null)}
                    className={`p-4 border rounded-lg text-left transition-colors duration-200 ${
                      !selectedOption 
                        ? 'border-primary-600 bg-primary-50 text-primary-600' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Standard</span>
                      <span className="font-semibold">${product.base_price.toFixed(2)}</span>
                    </div>
                  </button>
                  
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option)}
                      className={`p-4 border rounded-lg text-left transition-colors duration-200 ${
                        selectedOption?.id === option.id 
                          ? 'border-primary-600 bg-primary-50 text-primary-600' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{option.option_name}</div>
                          {option.description && (
                            <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                          )}
                        </div>
                        <span className="font-semibold">${option.price.toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-3 text-center min-w-[3rem] border-x border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-gray-600 hover:text-gray-800"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-gray-600">
                  Total: ${(currentPrice * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full text-lg py-3"
              >
                Add to Cart - ${(currentPrice * quantity).toFixed(2)}
              </button>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="flex-1 btn-secondary flex items-center justify-center"
                >
                  {isFavorite ? (
                    <HeartSolidIcon className="h-5 w-5 mr-2 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 mr-2" />
                  )}
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                
                <button className="btn-secondary flex items-center justify-center px-4">
                  <ShareIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Product ID:</dt>
                  <dd className="text-gray-900">{product.product_identifier}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Same-day delivery:</dt>
                  <dd className="text-green-600">Available</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 