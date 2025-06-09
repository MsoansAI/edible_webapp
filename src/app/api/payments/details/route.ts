import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Payment token is required' },
      { status: 400 }
    );
  }

  try {
    // First, get the order by payment token from the flat table for fastest lookup
    const { data: orderFlat, error: flatError } = await supabase
      .from('chatbot_orders_flat')
      .select('order_data')
      .eq('order_data->>\'payment_info\'->>\'payment_token\'', token)
      .single();

    if (flatError || !orderFlat) {
      console.log('Order not found in flat table, trying direct order lookup');
      
      // Fallback: Direct order lookup
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          payment_link_expires_at,
          status,
          scheduled_date,
          scheduled_time_slot,
          fulfillment_type,
          special_instructions,
          customers!inner (
            first_name,
            last_name,
            email,
            phone
          ),
          recipient_addresses (
            recipient_name,
            street_address,
            city,
            state,
            zip_code
          ),
          order_items!inner (
            quantity,
            unit_price,
            total_price,
            products!inner (
              product_identifier,
              name,
              description,
              image_url
            ),
            product_options (
              option_name
            )
          )
        `)
        .eq('payment_token', token)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: 'Payment link not found or expired' },
          { status: 404 }
        );
      }

      // Check if payment link has expired
      if (order.payment_link_expires_at && new Date(order.payment_link_expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Payment link has expired' },
          { status: 410 }
        );
      }

      // Format the direct order data
      const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      const delivery = Array.isArray(order.recipient_addresses) ? order.recipient_addresses[0] : order.recipient_addresses;
      
      const orderDetails = {
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        customerName: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
        items: order.order_items.map((item: any) => ({
          productId: item.products.product_identifier?.toString() || '',
          productName: item.products.name,
          productDescription: item.products.description || 'Premium fresh fruit arrangement crafted with the finest ingredients',
          productImage: item.products.image_url || '',
          optionName: item.product_options?.option_name || 'Standard',
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          totalPrice: parseFloat(item.total_price)
        })),
        delivery: delivery ? {
          address: `${delivery?.street_address}, ${delivery?.city}, ${delivery?.state} ${delivery?.zip_code}`,
          recipientName: delivery?.recipient_name,
          scheduledDate: order.scheduled_date,
          timeSlot: order.scheduled_time_slot
        } : null,
        expiresAt: order.payment_link_expires_at,
        status: order.status
      };

      return NextResponse.json({
        success: true,
        order: orderDetails
      });
    }

    // Use flat table data (faster)
    const orderData = orderFlat.order_data;

    // Check if payment link has expired
    const expiresAt = orderData.payment_info?.payment_link_expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    // Format flat table data
    const orderDetails = {
      orderNumber: orderData.order_info?.order_number,
      totalAmount: parseFloat(orderData.order_info?.total_amount || '0'),
      customerName: orderData.customer_info?.name || `${orderData.customer_info?.first_name || ''} ${orderData.customer_info?.last_name || ''}`.trim(),
      customerEmail: orderData.customer_info?.email || '',
      customerPhone: orderData.customer_info?.phone || '',
      items: (orderData.items || []).map((item: any) => ({
        productId: item.product_identifier?.toString() || '',
        productName: item.product_name,
        productDescription: item.product_description || 'Premium fresh fruit arrangement crafted with the finest ingredients',
        productImage: item.product_image_url || item.image_url || '',
        optionName: item.option_name || 'Standard',
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || '0'),
        totalPrice: parseFloat(item.total_price || '0')
      })),
      delivery: orderData.delivery_info ? {
        address: orderData.delivery_info.address,
        recipientName: orderData.delivery_info.recipient_name,
        scheduledDate: orderData.order_info?.scheduled_date,
        timeSlot: orderData.order_info?.scheduled_time_slot
      } : null,
      expiresAt: expiresAt,
      status: orderData.order_info?.status
    };

    return NextResponse.json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    console.error('Payment details error:', error);
    return NextResponse.json(
      { error: 'Failed to load payment details' },
      { status: 500 }
    );
  }
} 