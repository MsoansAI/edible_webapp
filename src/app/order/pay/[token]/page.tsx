'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheckIcon,
  CreditCardIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  productId: string;
  productName: string;
  productDescription: string;
  productImage: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderDetails {
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  delivery?: {
    address: string;
    recipientName: string;
    scheduledDate: string;
    timeSlot: string;
  };
  expiresAt: string;
  status: string;
}

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchOrderDetails();
    }
  }, [token]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/payments/details?token=${token}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payment link not found or expired');
        }
        throw new Error('Failed to load order details');
      }
      
      const data = await response.json();
      setOrderDetails(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderDetails) return;
    
    setPaymentProcessing(true);
    
    try {
      const paymentResponse = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderToken: token,
          orderNumber: orderDetails.orderNumber,
          amount: orderDetails.totalAmount,
          customerEmail: orderDetails.customerEmail,
          customerName: orderDetails.customerName,
        }),
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Payment failed');
      }
      
      const result = await paymentResponse.json();
      window.location.href = `/order/confirmation/${result.paymentId}`;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-primary-600 rounded-2xl flex items-center justify-center">
            <div className="loading-spinner"></div>
          </div>
          <h3 className="heading-card mb-3">Loading Your Order</h3>
          <p className="text-body">Retrieving your payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-neutral flex items-center justify-center section-padding">
        <div className="max-w-md mx-auto card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="heading-card mb-4 text-red-900">Payment Link Issue</h2>
          <p className="text-body mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) return null;

  const isExpired = new Date(orderDetails.expiresAt) < new Date();
  const expiryDate = new Date(orderDetails.expiresAt);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container-width section-padding py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="heading-section">Complete Your Payment</h1>
              </div>
            </div>
            
            <p className="text-large mb-4">
              Order <span className="font-semibold text-primary-600">#{orderDetails.orderNumber}</span>
            </p>
            
            {!isExpired ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-success-50 border border-success-200 rounded-full">
                <ShieldCheckIcon className="h-5 w-5 text-success-600" />
                <span className="text-small font-medium text-success-700">
                  Secure Payment • Expires {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-small font-medium text-red-700">Payment Link Expired</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Items */}
              <div className="card p-6">
                <h2 className="heading-card mb-6">Your Order</h2>
                
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-neutral-200 rounded-lg overflow-hidden">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-primary-50 flex items-center justify-center ${item.productImage ? 'hidden' : ''}`}>
                            <span className="text-2xl">🍓</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 mb-1">{item.productName}</h3>
                        <p className="text-small text-neutral-600 mb-2 line-clamp-2">
                          {item.productDescription || "Premium fresh fruit arrangement"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-small text-neutral-500">Qty: {item.quantity}</span>
                          <span className="product-price-small">${item.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Delivery Info */}
              <div className="card p-6">
                <h2 className="heading-card mb-6">Delivery Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-neutral-900 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-body">
                      <p><span className="text-neutral-500">Name:</span> {orderDetails.customerName}</p>
                      <p><span className="text-neutral-500">Email:</span> {orderDetails.customerEmail}</p>
                      <p><span className="text-neutral-500">Phone:</span> {orderDetails.customerPhone}</p>
                    </div>
                  </div>
                  
                  {orderDetails.delivery && (
                    <div>
                      <h3 className="font-medium text-neutral-900 mb-3">Delivery Information</h3>
                      <div className="space-y-2 text-body">
                        <p><span className="text-neutral-500">Recipient:</span> {orderDetails.delivery.recipientName}</p>
                        <p><span className="text-neutral-500">Address:</span><br className="md:hidden" /> {orderDetails.delivery.address}</p>
                        <p><span className="text-neutral-500">Scheduled:</span> {orderDetails.delivery.scheduledDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6 lg:sticky lg:top-8">
                <h2 className="heading-card mb-6">Payment Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-body">
                    <span>Subtotal</span>
                    <span>${(orderDetails.totalAmount * 0.92).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Tax & Fees</span>
                    <span>${(orderDetails.totalAmount * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-900 text-lg">Total</span>
                      <span className="product-price text-primary-600">${orderDetails.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!isExpired ? (
                  <div className="space-y-4">
                    <button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="btn-primary w-full btn-large flex items-center justify-center space-x-2"
                    >
                      {paymentProcessing ? (
                        <>
                          <div className="loading-spinner"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-5 w-5" />
                          <span>Complete Payment</span>
                        </>
                      )}
                    </button>
                    
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-success-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span className="text-small font-medium">Secure SSL Encrypted</span>
                      </div>
                      <p className="text-small text-neutral-500">
                        Protected by industry-standard security
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="font-medium text-red-800 mb-1">Payment Link Expired</p>
                      <p className="text-small text-red-600">Please contact us for assistance</p>
                    </div>
                    
                    <a 
                      href="tel:+1-800-EDIBLE"
                      className="btn-secondary w-full flex items-center justify-center space-x-2"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      <span>Call 1-800-EDIBLE</span>
                    </a>
                  </div>
                )}

                {/* Trust Signals */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-success-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircleIcon className="h-5 w-5 text-success-600" />
                      </div>
                      <p className="text-small text-neutral-600">Same-Day Delivery</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
                        <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <p className="text-small text-neutral-600">Satisfaction Guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 