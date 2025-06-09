/**
 * Test script for Payment Link Generation
 * 
 * This script demonstrates the complete payment flow:
 * 1. Create an order via phone call
 * 2. Generate a secure payment link
 * 3. Customer uses link to complete payment
 */

const SUPABASE_URL = 'https://jfjvqylmjzprnztbfhpa.supabase.co';
const ORDER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order`;

// Demo: Complete Payment Flow
async function demoPaymentFlow() {
  console.log('🎯 Testing Complete Payment Link Flow\n');
  
  try {
    // Step 1: Create an order (simulating phone order)
    console.log('📞 Step 1: Creating order via phone call...');
    const orderResponse = await fetch(ORDER_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify({
        customerPhone: '+14155551234', // Use existing customer
        storeNumber: 257, // Use existing store
        items: [
          {
            productId: '3075', // Use existing product
            quantity: 1
          }
        ],
        deliveryAddress: {
          recipientName: 'John Doe',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        specialInstructions: 'Please ring doorbell'
      })
    });

    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${await orderResponse.text()}`);
    }

    const orderData = await orderResponse.json();
    console.log('✅ Order created:', orderData.order.orderNumber);
    console.log('💰 Total amount:', orderData.order.total);
    
    // Extract order number for next step
    const orderNumber = orderData.order.orderNumber;
    
    // Step 2: Generate payment link
    console.log('\n🔗 Step 2: Generating secure payment link...');
    const paymentLinkResponse = await fetch(ORDER_FUNCTION_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
      },
      body: JSON.stringify({
        orderNumber: orderNumber,
        expirationHours: 24 // Link expires in 24 hours
      })
    });

    if (!paymentLinkResponse.ok) {
      throw new Error(`Payment link generation failed: ${await paymentLinkResponse.text()}`);
    }

    const paymentLinkData = await paymentLinkResponse.json();
    console.log('✅ Payment link generated!');
    console.log('🔒 Secure URL:', paymentLinkData.paymentUrl);
    console.log('⏰ Expires:', paymentLinkData.validUntil);
    
    // Step 3: Show what customer would see
    console.log('\n📱 Step 3: Customer experience...');
    console.log('The customer receives this link via SMS/email:');
    console.log(`${paymentLinkData.paymentUrl}`);
    console.log('\nWhen they click it, they see:');
    console.log('- Order summary with all items');
    console.log('- Total amount to pay');
    console.log('- Secure payment form');
    console.log('- Order confirmation after payment');
    
    return {
      orderNumber,
      paymentUrl: paymentLinkData.paymentUrl,
      total: orderData.order.total
    };
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    return null;
  }
}

// Run the demo
demoPaymentFlow().then(result => {
  if (result) {
    console.log('\n🎉 Payment flow demo completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`Order: ${result.orderNumber}`);
    console.log(`Amount: ${result.total}`);
    console.log(`Payment URL: ${result.paymentUrl}`);
    console.log('\n💡 Next steps:');
    console.log('1. Customer clicks the payment link');
    console.log('2. Reviews order details');
    console.log('3. Enters payment information');
    console.log('4. Completes payment');
    console.log('5. Order status updates to "paid" and "confirmed"');
  }
}); 