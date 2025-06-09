import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderToken, orderNumber, amount, customerEmail, customerName } = await request.json();

    if (!orderToken || !orderNumber || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Validate the payment token and order against the database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        payment_link_expires_at,
        status
      `)
      .eq('payment_token', orderToken)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Invalid payment token or order not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (order.status === 'paid' || order.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Order has already been paid' },
        { status: 400 }
      );
    }

    // Check if payment link has expired
    if (order.payment_link_expires_at && new Date(order.payment_link_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    // Validate amount matches order total
    if (Math.abs(parseFloat(order.total_amount) - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    console.log('Processing payment for validated order:', { orderNumber, amount, customerEmail });

    // TODO: Integrate with Square Payment API
    // This is where you would process the actual payment
    // For now, this is a placeholder that simulates payment processing
    
    const paymentResult = await simulatePaymentProcessing({
      orderNumber,
      amount,
      customerEmail,
      customerName,
    });

    if (paymentResult.success) {
      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_reference_id: paymentResult.paymentId,
          payment_completed_at: new Date().toISOString(),
        })
        .eq('payment_token', orderToken);

      if (updateError) {
        console.error('Error updating order status:', updateError);
        // Payment was successful but status update failed - this is important to log
        // In production, you might want to queue this for retry
      }

      console.log('Payment successful:', paymentResult.paymentId);

      return NextResponse.json({
        success: true,
        paymentId: paymentResult.paymentId,
        message: 'Payment processed successfully',
      });
    } else {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment processing failed' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Placeholder function - replace with actual Square integration
async function simulatePaymentProcessing(paymentData: {
  orderNumber: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}) {
  // This would normally call Square's API
  // For demonstration, we'll simulate a successful payment
  
  return new Promise<{ success: boolean; paymentId?: string; error?: string }>((resolve) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } else {
        resolve({
          success: false,
          error: 'Card declined',
        });
      }
    }, 2000); // Simulate processing time
  });
}

// TODO: Replace simulatePaymentProcessing with actual Square integration:
/*
import { Client, Environment } from 'squareup';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

async function processSquarePayment(paymentData: any) {
  try {
    const paymentsApi = squareClient.paymentsApi;
    
    const requestBody = {
      sourceId: paymentData.sourceId, // From Square Web SDK
      amountMoney: {
        amount: BigInt(Math.round(paymentData.amount * 100)), // Convert to cents
        currency: 'USD',
      },
      idempotencyKey: crypto.randomUUID(),
      orderId: paymentData.orderNumber,
      buyerEmailAddress: paymentData.customerEmail,
    };

    const response = await paymentsApi.createPayment(requestBody);
    
    if (response.result.payment) {
      return {
        success: true,
        paymentId: response.result.payment.id,
      };
    } else {
      return {
        success: false,
        error: 'Payment failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
*/ 