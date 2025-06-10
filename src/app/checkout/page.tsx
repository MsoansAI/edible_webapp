'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CreditCardIcon, 
  TruckIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  UserIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

interface FormData {
  // Contact Information
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Delivery Information
  recipientName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  deliveryInstructions: string
  
  // Payment Information
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  
  // Preferences
  saveInfo: boolean
  marketingEmails: boolean
}

interface FormErrors {
  [key: string]: string
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    recipientName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    deliveryInstructions: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    saveInfo: false,
    marketingEmails: true
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const subtotal = getTotal()
  const tax = subtotal * 0.0825
  const shipping = subtotal >= 65 ? 0 : 9.99
  const total = subtotal + tax + shipping

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Contact validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'

    // Delivery validation
    if (!formData.recipientName.trim()) errors.recipientName = 'Recipient name is required'
    if (!formData.streetAddress.trim()) errors.streetAddress = 'Street address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required'

    // Payment validation
    if (!formData.cardNumber.trim()) errors.cardNumber = 'Card number is required'
    if (!formData.expiryDate.trim()) errors.expiryDate = 'Expiry date is required'
    if (!formData.cvv.trim()) errors.cvv = 'CVV is required'
    if (!formData.nameOnCard.trim()) errors.nameOnCard = 'Name on card is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please correct the errors below')
      return
    }

    setIsProcessing(true)

    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Clear cart and show success
      clearCart()
      toast.success('🎉 Order placed successfully! Check your email for confirmation.')
      router.push('/order/confirmation/mock-payment-id')
    } catch (error) {
      toast.error('Failed to process order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return null
  }

  const steps = [
    { number: 1, title: 'Contact', icon: UserIcon },
    { number: 2, title: 'Delivery', icon: TruckIcon },
    { number: 3, title: 'Payment', icon: CreditCardIcon }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header with Progress */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="container-width section-padding py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="heading-section mb-2">Secure Checkout</h1>
                <p className="text-body">Complete your order in just a few steps</p>
              </div>
              
              <div className="hidden md:flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5 text-success-600" />
                <span className="text-small text-success-600 font-medium">SSL Secured</span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${
                    currentStep >= step.number ? 'text-primary-600' : 'text-neutral-400'
                  }`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      currentStep >= step.number 
                        ? 'bg-primary-600 border-primary-600 text-white' 
                        : 'border-neutral-300 text-neutral-400'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="hidden sm:inline font-medium">{step.title}</span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-primary-600' : 'bg-neutral-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-width section-padding py-8">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Form Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Contact Information */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-card flex items-center">
                      <UserIcon className="h-6 w-6 mr-3 text-primary-600" />
                      Contact Information
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-small text-neutral-500">Step 1 of 3</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={formErrors.firstName ? 'input-field-error' : 'input-field'} 
                      />
                      {formErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Last Name *</label>
                      <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={formErrors.lastName ? 'input-field-error' : 'input-field'} 
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Email Address *</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={formErrors.email ? 'input-field-error' : 'input-field'} 
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Phone Number *</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={formErrors.phone ? 'input-field-error' : 'input-field'} 
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-card flex items-center">
                      <TruckIcon className="h-6 w-6 mr-3 text-primary-600" />
                      Delivery Information
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-small text-neutral-500">Step 2 of 3</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Recipient Name *</label>
                      <input 
                        type="text" 
                        value={formData.recipientName}
                        onChange={(e) => handleInputChange('recipientName', e.target.value)}
                        className={formErrors.recipientName ? 'input-field-error' : 'input-field'}
                        placeholder="Who should receive this gift?" 
                      />
                      {formErrors.recipientName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.recipientName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Street Address *</label>
                      <input 
                        type="text" 
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                        className={formErrors.streetAddress ? 'input-field-error' : 'input-field'}
                        placeholder="123 Main Street, Apt 4B" 
                      />
                      {formErrors.streetAddress && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.streetAddress}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">City *</label>
                        <input 
                          type="text" 
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={formErrors.city ? 'input-field-error' : 'input-field'} 
                        />
                        {formErrors.city && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">State *</label>
                        <input 
                          type="text" 
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className={formErrors.state ? 'input-field-error' : 'input-field'} 
                        />
                        {formErrors.state && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">ZIP Code *</label>
                        <input 
                          type="text" 
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className={formErrors.zipCode ? 'input-field-error' : 'input-field'} 
                        />
                        {formErrors.zipCode && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="label">Delivery Instructions</label>
                      <textarea 
                        rows={3}
                        value={formData.deliveryInstructions}
                        onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                        className="input-field"
                        placeholder="Special instructions for delivery (gate code, leave at door, etc.)" 
                      />
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <div className="mt-6 p-4 bg-primary-50 border-l-4 border-primary-600">
                    <div className="flex items-start">
                      <TruckIcon className="h-5 w-5 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-primary-700">Same-Day Delivery Available</h4>
                        <p className="text-small text-primary-600 mt-1">
                          Order by 2 PM for same-day delivery. Fresh arrangements delivered with care.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="heading-card flex items-center">
                      <LockClosedIcon className="h-6 w-6 mr-3 text-primary-600" />
                      Payment Information
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-small text-neutral-500">Step 3 of 3</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Card Number *</label>
                      <input 
                        type="text" 
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        className={formErrors.cardNumber ? 'input-field-error' : 'input-field'}
                        placeholder="1234 5678 9012 3456" 
                      />
                      {formErrors.cardNumber && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Expiry Date *</label>
                        <input 
                          type="text" 
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className={formErrors.expiryDate ? 'input-field-error' : 'input-field'}
                          placeholder="MM/YY" 
                        />
                        {formErrors.expiryDate && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.expiryDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="label">Security Code *</label>
                        <input 
                          type="text" 
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className={formErrors.cvv ? 'input-field-error' : 'input-field'}
                          placeholder="123" 
                        />
                        {formErrors.cvv && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="label">Name on Card *</label>
                      <input 
                        type="text" 
                        value={formData.nameOnCard}
                        onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                        className={formErrors.nameOnCard ? 'input-field-error' : 'input-field'}
                        placeholder="John Doe" 
                      />
                      {formErrors.nameOnCard && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.nameOnCard}</p>
                      )}
                    </div>

                    {/* Payment Security */}
                    <div className="mt-6 p-4 bg-success-50 border border-success-200">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-success-600 mr-3" />
                        <div>
                          <p className="font-medium text-success-700">Your payment is secure</p>
                          <p className="text-small text-success-600">256-bit SSL encryption protects your information</p>
                        </div>
                      </div>
                    </div>

                    {/* Accepted Cards */}
                    <div className="flex items-center space-x-2 pt-4 border-t border-neutral-200">
                      <span className="text-small text-neutral-600">We accept:</span>
                      <div className="flex space-x-2">
                        {['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'].map((card) => (
                          <div key={card} className="px-2 py-1 bg-neutral-100 text-xs font-medium text-neutral-700">
                            {card}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="card p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.saveInfo}
                        onChange={(e) => handleInputChange('saveInfo', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                      />
                      <span className="ml-3 text-small text-neutral-600">
                        Save my information for faster checkout next time
                      </span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.marketingEmails}
                        onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                      />
                      <span className="ml-3 text-small text-neutral-600">
                        Send me exclusive offers and updates (optional)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="card p-6 sticky top-32">
                  <h2 className="heading-card mb-6">Order Summary</h2>
                  
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => {
                      const price = item.option ? item.option.price : item.product.base_price
                      return (
                        <div key={`${item.product.id}-${item.option?.id || 'none'}`} className="flex items-start space-x-4 p-3 bg-neutral-50 border border-neutral-200">
                          <div className="w-16 h-16 bg-neutral-200 flex-shrink-0 overflow-hidden">
                            {item.product.image_url ? (
                              <Image
                                src={item.product.image_url}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                <span className="text-primary-600 text-xs font-medium">IMG</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-neutral-900 text-sm leading-tight">
                              {item.product.name}
                            </h4>
                            {item.option && (
                              <p className="text-xs text-neutral-500 mt-1">{item.option.option_name}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-neutral-500">Qty: {item.quantity}</span>
                              <span className="font-semibold text-neutral-900 text-sm">
                                ${(price * item.quantity).toFixed(2)}
                              </span>
                          </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Order Totals */}
                  <div className="space-y-3 mb-6 pt-4 border-t border-neutral-200">
                    <div className="flex justify-between text-body">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-body">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-body">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-success-600 font-medium' : ''}>
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                      <span className="text-lg font-bold text-neutral-900">Total</span>
                      <span className="text-2xl font-bold text-neutral-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-primary btn-large w-full mb-4"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Processing Order...
                      </div>
                    ) : (
                      <>
                        <LockClosedIcon className="h-5 w-5 mr-2" />
                        Complete Order • ${total.toFixed(2)}
                      </>
                    )}
                  </button>
                  
                  {/* Trust Signals */}
                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex items-center text-small text-neutral-600">
                      <ShieldCheckIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                      <span>256-bit SSL secure checkout</span>
                  </div>
                    
                    <div className="flex items-center text-small text-neutral-600">
                      <TruckIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                      <span>Same-day delivery available</span>
              </div>

                    <div className="flex items-center text-small text-neutral-600">
                      <HeartIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                      <span>100% satisfaction guarantee</span>
                </div>

                    <div className="flex items-center text-small text-neutral-600">
                      <StarIcon className="h-4 w-4 text-success-600 mr-3 flex-shrink-0" />
                      <span>4.9/5 customer rating</span>
                  </div>
                </div>

                  {/* Support */}
                  <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200">
                    <h4 className="font-medium text-neutral-900 mb-2">Need Help?</h4>
                    <p className="text-small text-neutral-600 mb-3">
                      Our customer service team is here to help
                    </p>
                    <div className="text-small">
                      <p className="text-primary-600 font-medium">Call: 1-800-EDIBLE</p>
                      <p className="text-primary-600 font-medium">Chat: Available 24/7</p>
                    </div>
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