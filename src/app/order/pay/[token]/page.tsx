'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

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
      // This would call your edge function to get order details by payment token
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
      // This would integrate with Square or your payment processor
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
      
      // Redirect to success page
      window.location.href = `/order/confirmation/${result.paymentId}`;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Your Order</h3>
          <p className="text-slate-600">Retrieving your payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Link Issue</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetails) return null;

  const isExpired = new Date(orderDetails.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header - Just the essentials */}
      <div className="text-center py-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
        <p className="text-lg text-gray-600">Order #{orderDetails.orderNumber}</p>
        {!isExpired && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Secure payment • Expires {new Date(orderDetails.expiresAt).toLocaleDateString()} at {new Date(orderDetails.expiresAt).toLocaleTimeString()}
          </p>
        )}
        {isExpired && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg max-w-md mx-auto">
            <p className="text-red-800 font-medium">⚠️ Payment Link Expired</p>
            <p className="text-red-600 text-sm mt-1">Please call 1-800-EDIBLE for help</p>
          </div>
        )}
      </div>

      {/* Responsive Layout - Simple on mobile, two columns on desktop */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
          
          {/* Left Column - Product Info (Mobile: stacked, Desktop: 2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* What You're Buying - With Real Images */}
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center lg:text-left">🍓 What You're Buying</h2>
              
              {orderDetails.items.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-6 mb-4 border-2 border-gray-300">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center ${item.productImage ? 'hidden' : ''}`}>
                          <div className="text-center">
                            <div className="text-4xl mb-2">🍓</div>
                            <div className="text-sm text-red-600 font-medium">Premium Gift</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{item.productName}</h3>
                      <p className="text-gray-600 mb-4">{item.productDescription || "Premium fresh fruit arrangement"}</p>
                      
                      <div className="space-y-2">
                        <p className="text-lg text-gray-700">Quantity: <span className="font-bold">{item.quantity}</span></p>
                        <p className="text-2xl lg:text-3xl font-bold text-green-600">${item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Info - Desktop Only */}
            <div className="hidden lg:block bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👤 Customer Information</h2>
              <div className="bg-white rounded-lg p-6 border-2 border-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                  <div>
                    <p><span className="font-bold">Name:</span> {orderDetails.customerName}</p>
                    <p><span className="font-bold">Phone:</span> {orderDetails.customerPhone}</p>
                    <p><span className="font-bold">Email:</span> {orderDetails.customerEmail}</p>
                  </div>
                  {orderDetails.delivery && (
                    <div>
                      <p><span className="font-bold">Delivery To:</span> {orderDetails.delivery.recipientName}</p>
                      <p><span className="font-bold">Address:</span><br/>{orderDetails.delivery.address}</p>
                      <p><span className="font-bold">When:</span> {orderDetails.delivery.scheduledDate}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Info (Mobile: stacked, Desktop: 1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Info - Mobile Only */}
            <div className="lg:hidden bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">👤 Customer Information</h2>
              <div className="bg-white rounded-lg p-6 border-2 border-gray-300">
                <div className="space-y-4 text-xl">
                  <p><span className="font-bold">Name:</span> {orderDetails.customerName}</p>
                  <p><span className="font-bold">Phone:</span> {orderDetails.customerPhone}</p>
                  <p><span className="font-bold">Email:</span> {orderDetails.customerEmail}</p>
                  {orderDetails.delivery && (
                    <>
                      <p><span className="font-bold">Delivery To:</span> {orderDetails.delivery.recipientName}</p>
                      <p><span className="font-bold">Address:</span><br/>{orderDetails.delivery.address}</p>
                      <p><span className="font-bold">When:</span> {orderDetails.delivery.scheduledDate}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Total Cost - Sticky on Desktop */}
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 lg:sticky lg:top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center lg:text-left">💰 Total To Pay</h2>
              <div className="bg-white rounded-lg p-6 border-2 border-gray-300 text-center">
                <p className="text-4xl lg:text-5xl font-bold text-green-600 mb-2">${orderDetails.totalAmount.toFixed(2)}</p>
                <p className="text-lg text-gray-600 mb-6">Total (including tax and delivery)</p>
                
                {/* Pay Button */}
                {!isExpired ? (
                  <div>
                    <button
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-6 lg:py-8 px-8 lg:px-16 rounded-lg text-2xl lg:text-3xl transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {paymentProcessing ? (
                        "Processing..."
                      ) : (
                        "🔒 PAY NOW"
                      )}
                    </button>
                    
                    <div className="mt-4 space-y-2">
                      <p className="text-lg lg:text-xl text-gray-600">
                        ✓ Safe & Secure Payment
                      </p>
                      <p className="text-sm lg:text-base text-gray-500">
                        Powered by Square • Same security as your bank
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200 mb-4">
                      <p className="text-xl font-bold text-red-800 mb-1">⚠️ Payment Link Expired</p>
                      <p className="text-lg text-red-600">Please call us for help</p>
                    </div>
                    <a 
                      href="tel:+1-800-EDIBLE"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors inline-block w-full"
                    >
                      📞 Call 1-800-EDIBLE
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 