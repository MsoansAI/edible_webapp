'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon, HeartIcon, ShieldCheckIcon, TruckIcon, GiftIcon } from '@heroicons/react/24/outline'

// Sample cart data for testing
const sampleCartItems = [
  {
    product: {
      id: '1',
      product_identifier: 6479,
      name: 'Sweet Berry Medley',
      base_price: 39.99,
      image_url: 'https://cdn.ediblearrangements.com/media/catalog/product/cache/60a12e7cdab0e008f4b86777ace7577e/4/5/4502_2887_large.webp'
    },
    option: {
      id: 'opt1',
      option_name: 'Large',
      price: 59.99
    },
    quantity: 2
  },
  {
    product: {
      id: '2',
      product_identifier: 3075,
      name: 'Chocolate Berry Bouquet',
      base_price: 45.99,
      image_url: 'https://cdn.ediblearrangements.com/media/catalog/product/cache/60a12e7cdab0e008f4b86777ace7577e/4/5/4502_2887_small.webp'
    },
    option: null,
    quantity: 1
  }
]

export default function CartTestPage() {
  const items = sampleCartItems
  const subtotal = items.reduce((total, item) => {
    const price = item.option ? item.option.price : item.product.base_price
    return total + (price * item.quantity)
  }, 0)
  const tax = subtotal * 0.0825
  const shipping = subtotal >= 65 ? 0 : 9.99
  const total = subtotal + tax + shipping

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="heading-section mb-2">Shopping Cart Test</h1>
              <p className="text-body">
                Testing price positioning with sample data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, index) => {
              const price = item.option ? item.option.price : item.product.base_price

              return (
                <div key={index} className="cart-item relative">
                  {/* Remove Button - Fixed Position Top Right at cart item level (n-2) */}
                  <button
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 rounded z-10"
                    aria-label="Remove item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>

                  {/* Price Display - Fixed Position at cart item level (n-2) */}
                  <div className="absolute bottom-4 right-4 text-right z-5">
                    <p className="product-price-small mb-1">
                      ${(price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-small text-neutral-500">
                      ${price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-start gap-6 pr-32 pb-20">
                    
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-neutral-50 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      {/* Product Info */}
                      <div className="mb-4">
                        <h3 className="heading-card mb-2">
                          <Link 
                            href={`/products/${item.product.product_identifier}`}
                            className="hover:text-primary-600 transition-colors duration-200"
                          >
                            {item.product.name}
                          </Link>
                        </h3>
                        
                        {item.option && (
                          <p className="text-small text-neutral-600 mb-1">
                            Size: {item.option.option_name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-small text-neutral-500">
                          <span>ID: {item.product.product_identifier}</span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-success-500 mr-1"></span>
                            Fresh guaranteed
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <span className="text-small text-neutral-600 font-medium">Quantity:</span>
                        <div className="quantity-selector">
                          <button className="quantity-btn">
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 text-center min-w-[3rem] font-semibold border-x border-neutral-300">
                            {item.quantity}
                          </span>
                          <button className="quantity-btn">
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Let's also test an alternative layout */}
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-700 mb-2">Alternative Price Layout:</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total:</span>
                          <span className="text-lg font-bold">${(price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-neutral-500">Per item:</span>
                          <span className="text-sm text-neutral-500">${price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-6">
              <h2 className="heading-card mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-body">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-body">Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-body">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-success-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-neutral-900">Total</span>
                    <span className="text-2xl font-bold text-neutral-900">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <Link href="/checkout" className="btn-primary btn-large w-full text-center block">
                  Proceed to Checkout
                </Link>
                
                <Link href="/products" className="btn-secondary w-full text-center block">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 