import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

interface RateLimitEntry {
  ip: string;
  endpoint: string;
  request_count: number;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('api_rate_limits')
      .select('request_count')
      .eq('ip', clientIP)
      .eq('endpoint', 'order')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .single();

    if (rateLimitData && rateLimitData.request_count >= 20) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please wait a moment.',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
        }
      );
    }

    // Log the request for rate limiting
    await supabase.from('api_rate_limits').upsert({
      ip: clientIP,
      endpoint: 'order',
      request_count: (rateLimitData?.request_count || 0) + 1,
      created_at: new Date().toISOString()
    });

    const method = req.method;
    const url = new URL(req.url);
    
    if (method === 'GET') {
      // GET: Retrieve orders
      const customerId = url.searchParams.get('customerId');
      const orderNumber = url.searchParams.get('orderNumber');
      const outputType = url.searchParams.get('outputType') || 'streamlined';

      if (!customerId && !orderNumber) {
        return new Response(
          JSON.stringify({ error: 'Either customerId or orderNumber is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase.from('chatbot_orders_flat').select('*');
      
      if (customerId) {
        // Get most recent order for customer
        query = query.eq('customer_info->id', customerId).order('created_at', { ascending: false }).limit(1);
      } else if (orderNumber) {
        // Search by last 4 digits of order number
        query = query.like('order_info->order_number', `%${orderNumber}-%`);
      }

      const { data: orderData, error: orderError } = await query;

      if (orderError || !orderData || orderData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const order = orderData[0];

      if (outputType === 'json') {
        return new Response(
          JSON.stringify({
            order: order,
            orderId: order.order_info?.id,
            lastUpdated: order.updated_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Streamlined format
      const streamlined = {
        order: {
          orderNumber: order.order_info?.order_number,
          status: order.order_info?.status,
          total: `$${order.order_info?.total_amount}`,
          estimatedDelivery: `${order.order_info?.scheduled_date} ${order.order_info?.scheduled_time_slot}`,
          items: order.items?.map((item: any) => ({
            product: item.product_name,
            price: `$${item.price}`,
            quantity: item.quantity,
            addons: item.addons || []
          })) || [],
          delivery: order.delivery_info ? {
            address: `${order.delivery_info.street}, ${order.delivery_info.city}, ${order.delivery_info.state}`,
            instructions: order.delivery_info.special_instructions
          } : null
        },
        summary: `Found order ${order.order_info?.order_number} for you.`
      };

      return new Response(
        JSON.stringify(streamlined),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'POST') {
      // POST: Create new order (reuse existing create-order logic)
      const requestData = await req.json();
      
      // Implementation would go here - this maintains the existing create-order functionality
      return new Response(
        JSON.stringify({ message: 'Order creation not implemented in this version' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (method === 'PATCH') {
      // PATCH: Update existing order - FIXED TO UPDATE NORMALIZED TABLES
      const requestData = await req.json();
      const { orderId, updates, outputType = 'streamlined' } = requestData;

      if (!orderId || !updates) {
        return new Response(
          JSON.stringify({ error: 'orderId and updates are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // First, check if order exists and get its current status
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('id, status, order_number')
        .eq('id', orderId)
        .single();

      if (fetchError || !currentOrder) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if order can be modified
      if (currentOrder.status === 'shipped' || currentOrder.status === 'delivered') {
        return new Response(
          JSON.stringify({
            error: 'Order cannot be modified',
            message: `Order ${currentOrder.order_number} is ${currentOrder.status} and cannot be modified.`,
            currentStatus: currentOrder.status
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ UPDATE NORMALIZED TABLES (NOT FLAT TABLES)
      
      // Update main orders table for these fields
      const orderUpdates: any = {};
      if (updates.scheduled_date) orderUpdates.scheduled_date = updates.scheduled_date;
      if (updates.scheduled_time_slot) orderUpdates.scheduled_time_slot = updates.scheduled_time_slot;
      if (updates.special_instructions) orderUpdates.special_instructions = updates.special_instructions;
      if (updates.pickup_customer_name) orderUpdates.pickup_customer_name = updates.pickup_customer_name;

      if (Object.keys(orderUpdates).length > 0) {
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update(orderUpdates)
          .eq('id', orderId);

        if (orderUpdateError) {
          console.error('Error updating orders table:', orderUpdateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Update recipient_addresses table if delivery address is being changed
      if (updates.delivery_address) {
        // First get the recipient_address_id from the order
        const { data: orderData, error: orderFetchError } = await supabase
          .from('orders')
          .select('recipient_address_id')
          .eq('id', orderId)
          .single();

        if (orderFetchError) {
          console.error('Error fetching order for address update:', orderFetchError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch order for address update' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (orderData.recipient_address_id) {
          const addressUpdates: any = {};
          if (updates.delivery_address.street) addressUpdates.street_address = updates.delivery_address.street;
          if (updates.delivery_address.city) addressUpdates.city = updates.delivery_address.city;
          if (updates.delivery_address.state) addressUpdates.state = updates.delivery_address.state;
          if (updates.delivery_address.zipCode) addressUpdates.zip_code = updates.delivery_address.zipCode;
          if (updates.delivery_address.specialInstructions) addressUpdates.delivery_instructions = updates.delivery_address.specialInstructions;

          const { error: addressUpdateError } = await supabase
            .from('recipient_addresses')
            .update(addressUpdates)
            .eq('id', orderData.recipient_address_id);

          if (addressUpdateError) {
            console.error('Error updating recipient_addresses table:', addressUpdateError);
            return new Response(
              JSON.stringify({ error: 'Failed to update delivery address' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: 'This order does not have a delivery address to update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // ✅ TRIGGERS WILL AUTOMATICALLY UPDATE chatbot_orders_flat

      // Wait a moment for triggers to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch the updated order from the flat table (now updated by triggers)
      const { data: updatedOrderData, error: fetchUpdatedError } = await supabase
        .from('chatbot_orders_flat')
        .select('*')
        .eq('order_info->id', orderId)
        .single();

      if (fetchUpdatedError) {
        console.error('Error fetching updated order:', fetchUpdatedError);
        return new Response(
          JSON.stringify({ error: 'Update completed but could not fetch updated order' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (outputType === 'json') {
        return new Response(
          JSON.stringify({
            order: updatedOrderData,
            orderId: orderId,
            lastUpdated: updatedOrderData.updated_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Streamlined response
      const order = updatedOrderData;
      const streamlined = {
        order: {
          orderNumber: order.order_info?.order_number,
          status: order.order_info?.status,
          total: `$${order.order_info?.total_amount}`,
          estimatedDelivery: `${order.order_info?.scheduled_date} ${order.order_info?.scheduled_time_slot}`,
          items: order.items?.map((item: any) => ({
            product: item.product_name,
            price: `$${item.price}`,
            quantity: item.quantity,
            addons: item.addons || []
          })) || [],
          delivery: order.delivery_info ? {
            address: `${order.delivery_info.street}, ${order.delivery_info.city}, ${order.delivery_info.state}`,
            instructions: order.delivery_info.special_instructions
          } : null
        },
        summary: `Order ${order.order_info?.order_number} updated successfully.`
      };

      return new Response(
        JSON.stringify(streamlined),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 