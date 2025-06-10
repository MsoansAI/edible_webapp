'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon, HeartIcon, ShieldCheckIcon, TruckIcon, GiftIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal, getItemCount } = useCartStore()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const subtotal = getTotal()
  const tax = subtotal * 0.0825 // 8.25% tax rate
  const shipping = subtotal >= 65 ? 0 : 9.99
  const total = subtotal + tax + shipping
  const freeShippingThreshold = 65
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)

  const handleQuantityChange = async (productId: string, optionId: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) return
    
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
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      clearCart()
      toast.success('Cart cleared')
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-width section-padding section-spacing">
          <div className="bg-white card p-16 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-neutral-100 flex items-center justify-center mx-auto mb-8">
              <ShoppingBagIcon className="h-10 w-10 text-neutral-400" />
            </div>
            <h1 className="heading-section mb-6">Your Cart is Empty</h1>
            <p className="text-large mb-8 text-neutral-600">
              Discover our premium fruit arrangements and gourmet treats. Perfect for any occasion or just because.
            </p>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/products" className="btn-primary btn-large">
                <GiftIcon className="h-5 w-5 mr-2" />
                Start Shopping
              </Link>
              <Link href="/products?category=arrangements" className="btn-secondary">
                View Arrangements
              </Link>
            </div>

            {/* Featured Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-neutral-200">
              <div className="text-center">
                <TruckIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-900">Same-Day Delivery</p>
              </div>
              <div className="text-center">
                <ShieldCheckIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-900">Fresh Guarantee</p>
              </div>
              <div className="text-center">
                <HeartIcon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-900">Handcrafted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="heading-section mb-2">Shopping Cart</h1>
              <p className="text-body">
                {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            
            <button
              onClick={handleClearCart}
              className="btn-ghost btn-small text-neutral-500 hover:text-primary-600 self-start sm:self-center"
            >
              Clear Cart
            </button>
          </div>

          {/* Free Shipping Progress */}
          {remainingForFreeShipping > 0 && (
            <div className="mt-6 p-4 bg-primary-50 border border-primary-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary-700">
                  Add ${remainingForFreeShipping.toFixed(2)} more for FREE shipping!
                </p>
                <TruckIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="w-full bg-primary-200 h-2">
                <div 
                  className="bg-primary-600 h-2 transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => {
              const itemKey = `${item.product.id}-${item.option?.id || 'none'}`
              const price = item.option ? item.option.price : item.product.base_price
              const isUpdatingThis = isUpdating === itemKey

              return (
                <div key={itemKey} className="cart-item relative">
                  {/* Remove Button - Fixed Position Top Right at cart item level (n-2) */}
                  <button
                    onClick={() => handleRemoveItem(item.product.id, item.option?.id)}
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
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-neutral-400 text-xs">No image</span>
                        </div>
                      )}
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
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.option?.id, item.quantity - 1)}
                            disabled={isUpdatingThis || item.quantity <= 1}
                            className="quantity-btn"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          
                          <span className="px-4 py-2 text-center min-w-[3rem] font-semibold border-x border-neutral-300">
                            {isUpdatingThis ? (
                              <div className="loading-spinner mx-auto"></div>
                            ) : (
                              item.quantity
                            )}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.option?.id, item.quantity + 1)}
                            disabled={isUpdatingThis}
                            className="quantity-btn"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Suggested Products */}
            <div className="card p-6 mt-8">
              <h3 className="heading-card mb-4">You might also like</h3>
              <p className="text-body text-neutral-600 mb-4">
                Complete your order with these popular additions
              </p>
              <Link href="/products" className="btn-secondary btn-small">
                Browse More Products
              </Link>
            </div>
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
              
              {/* Trust Signals */}
              <div className="space-y-3 pt-6 border-t border-neutral-200">
                <div className="flex items-center text-small">
                  <ShieldCheckIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                  <span className="text-neutral-600">Secure SSL checkout</span>
                </div>
                <div className="flex items-center text-small">
                  <TruckIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                  <span className="text-neutral-600">Same-day delivery available</span>
                </div>
                <div className="flex items-center text-small">
                  <HeartIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                  <span className="text-neutral-600">100% satisfaction guarantee</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-6 border-t border-neutral-200">
                <p className="text-small text-neutral-600 mb-3">We accept</p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-neutral-100 text-xs font-medium">VISA</div>
                  <div className="px-3 py-1 bg-neutral-100 text-xs font-medium">MASTERCARD</div>
                  <div className="px-3 py-1 bg-neutral-100 text-xs font-medium">AMEX</div>
                  <div className="px-3 py-1 bg-neutral-100 text-xs font-medium">PAYPAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 