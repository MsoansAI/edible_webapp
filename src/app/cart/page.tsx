'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal, getItemCount } = useCartStore()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const subtotal = getTotal()
  const tax = subtotal * 0.0825 // 8.25% tax rate
  const shipping = subtotal >= 65 ? 0 : 9.99
  const total = subtotal + tax + shipping

  const handleQuantityChange = async (productId: string, optionId: string | undefined, newQuantity: number) => {
    setIsUpdating(`${productId}-${optionId || 'none'}`)
    try {
      updateQuantity(productId, newQuantity, optionId)
      toast.success('Cart updated')
    } catch (error) {
      toast.error('Failed to update cart')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = (productId: string, optionId?: string) => {
    removeItem(productId, optionId)
    toast.success('Item removed from cart')
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
      toast.success('Cart cleared')
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        
        <div className="container-width section-padding py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBagIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-display mb-4">
              Your cart is empty
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link href="/products" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      
      <div className="container-width section-padding py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">
              {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          
          <button
            onClick={handleClearCart}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const itemKey = `${item.product.id}-${item.option?.id || 'none'}`
                const price = item.option ? item.option.price : item.product.base_price
                const isUpdatingThis = isUpdating === itemKey

                return (
                  <div key={itemKey} className="card p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url}
                            alt={item.product.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              <Link 
                                href={`/products/${item.product.product_identifier}`}
                                className="hover:text-primary-600 transition-colors duration-200"
                              >
                                {item.product.name}
                              </Link>
                            </h3>
                            
                            {item.option && (
                              <p className="text-sm text-gray-600 mb-2">
                                Option: {item.option.option_name}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-500">
                              ID: {item.product.product_identifier}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(item.product.id, item.option?.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            aria-label="Remove item"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3 sm:gap-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(item.product.id, item.option?.id, item.quantity - 1)}
                                disabled={isUpdatingThis || item.quantity <= 1}
                                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              
                              <span className="px-4 py-2 text-center min-w-[3rem] border-x border-gray-300">
                                {isUpdatingThis ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              
                              <button
                                onClick={() => handleQuantityChange(item.product.id, item.option?.id, item.quantity + 1)}
                                disabled={isUpdatingThis}
                                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${(price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                {subtotal < 65 && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Add ${(65 - subtotal).toFixed(2)} more for free shipping!
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Link href="/checkout" className="btn-primary w-full text-center block">
                  Proceed to Checkout
                </Link>
                
                <Link href="/products" className="btn-secondary w-full text-center block">
                  Continue Shopping
                </Link>
              </div>
              
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Same-day delivery available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 