'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCardIcon, TruckIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'

import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const subtotal = getTotal()
  const tax = subtotal * 0.0825
  const shipping = subtotal >= 65 ? 0 : 9.99
  const total = subtotal + tax + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear cart and show success
      clearCart()
      toast.success('Order placed successfully!')
      router.push('/')
    } catch (error) {
      toast.error('Failed to process order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="container-width section-padding py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-8">Checkout</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary - Mobile First */}
              <div className="lg:col-span-1 lg:order-2">
                <div className="card p-4 sm:p-6 lg:sticky lg:top-24">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    {items.map((item) => {
                      const price = item.option ? item.option.price : item.product.base_price
                      return (
                        <div key={`${item.product.id}-${item.option?.id || 'none'}`} className="flex justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                            {item.option && (
                              <p className="text-xs text-gray-500">{item.option.option_name}</p>
                            )}
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${(price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary w-full mt-6"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Place Order - $${total.toFixed(2)}`
                    )}
                  </button>
                  
                  <div className="mt-4 text-center text-xs text-gray-500">
                    <p>Your payment information is secure and encrypted</p>
                  </div>
                </div>
              </div>

              {/* Forms Column */}
              <div className="lg:col-span-1 lg:order-1 space-y-6 sm:space-y-8">
                {/* Contact Information */}
                <div className="card p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Contact Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" required className="input-field" />
                    <input type="text" placeholder="Last Name" required className="input-field" />
                    <input type="email" placeholder="Email" required className="input-field" />
                    <input type="tel" placeholder="Phone" required className="input-field" />
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="card p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                    <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Delivery Information
                  </h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="Recipient Name" required className="input-field" />
                    <input type="text" placeholder="Street Address" required className="input-field" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <input type="text" placeholder="City" required className="input-field" />
                      <input type="text" placeholder="State" required className="input-field" />
                      <input type="text" placeholder="ZIP Code" required className="input-field" />
                    </div>
                    <textarea placeholder="Delivery Instructions" rows={3} className="input-field" />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="card p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                    <CreditCardIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Payment Information
                  </h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="Card Number" required className="input-field" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="MM/YY" required className="input-field" />
                      <input type="text" placeholder="CVV" required className="input-field" />
                    </div>
                    <input type="text" placeholder="Name on Card" required className="input-field" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 