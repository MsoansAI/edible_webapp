import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
};

interface ItemAction {
  action: 'add' | 'update' | 'remove';
  itemId?: string; // For update/remove
  productId?: string; // For add
  productOptionId?: string; // Optional for add
  quantity?: number; // For add/update
  addons?: Array<{
    addonId: string;
    quantity: number;
  }>; // For add/update
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow PATCH method
  if (req.method !== 'PATCH') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      .eq('identifier', clientIP)
      .eq('endpoint', 'order-items')
      .gte('window_start', new Date(Date.now() - 60000).toISOString())
      .single();

    if (rateLimitData && rateLimitData.request_count >= 15) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many item update requests. Please wait a moment.',
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
      identifier: clientIP,
      endpoint: 'order-items',
      request_count: (rateLimitData?.request_count || 0) + 1,
      window_start: new Date().toISOString()
    });

    const requestData = await req.json();
    const { orderId, items, outputType = 'streamlined' } = requestData;

    if (!orderId || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'orderId and items array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate items array
    for (const item of items) {
      if (!item.action || !['add', 'update', 'remove'].includes(item.action)) {
        return new Response(
          JSON.stringify({ error: 'Each item must have a valid action: add, update, or remove' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (item.action === 'add' && (!item.productId || !item.quantity)) {
        return new Response(
          JSON.stringify({ error: 'Add action requires productId and quantity' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if ((item.action === 'update' || item.action === 'remove') && !item.itemId) {
        return new Response(
          JSON.stringify({ error: `${item.action} action requires itemId` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if order exists and can be modified
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
          message: `Order ${currentOrder.order_number} is ${currentOrder.status} and items cannot be modified.`,
          currentStatus: currentOrder.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each item action
    for (const item of items) {
      if (item.action === 'add') {
        // Get product and option information for pricing
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, base_price')
          .eq('id', item.productId)
          .single();

        if (productError || !productData) {
          return new Response(
            JSON.stringify({ error: `Product ${item.productId} not found` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let unitPrice = productData.base_price;
        
        // If product option specified, use option price
        if (item.productOptionId) {
          const { data: optionData, error: optionError } = await supabase
            .from('product_options')
            .select('price')
            .eq('id', item.productOptionId)
            .single();

          if (optionError || !optionData) {
            return new Response(
              JSON.stringify({ error: `Product option ${item.productOptionId} not found` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          unitPrice = optionData.price;
        }

        const totalPrice = parseFloat(unitPrice) * item.quantity;

        // Add the item
        const { data: newItem, error: addError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: item.productId,
            product_option_id: item.productOptionId || null,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          })
          .select('id')
          .single();

        if (addError) {
          console.error('Error adding item:', addError);
          return new Response(
            JSON.stringify({ error: 'Failed to add item to order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add addons if specified
        if (item.addons && item.addons.length > 0) {
          for (const addon of item.addons) {
            // Get addon price
            const { data: addonData, error: addonError } = await supabase
              .from('addons')
              .select('price')
              .eq('id', addon.addonId)
              .single();

            if (addonError || !addonData) {
              console.error(`Addon ${addon.addonId} not found`);
              continue;
            }

            await supabase
              .from('order_addons')
              .insert({
                order_item_id: newItem.id,
                addon_id: addon.addonId,
                quantity: addon.quantity,
                unit_price: addonData.price
              });
          }
        }

      } else if (item.action === 'update') {
        // Verify item belongs to this order
        const { data: existingItem, error: itemError } = await supabase
          .from('order_items')
          .select('id, order_id, product_id, product_option_id, unit_price')
          .eq('id', item.itemId)
          .eq('order_id', orderId)
          .single();

        if (itemError || !existingItem) {
          return new Response(
            JSON.stringify({ error: `Item ${item.itemId} not found in this order` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update quantity and recalculate total
        if (item.quantity) {
          const newTotalPrice = parseFloat(existingItem.unit_price) * item.quantity;
          
          const { error: updateError } = await supabase
            .from('order_items')
            .update({
              quantity: item.quantity,
              total_price: newTotalPrice
            })
            .eq('id', item.itemId);

          if (updateError) {
            console.error('Error updating item:', updateError);
            return new Response(
              JSON.stringify({ error: 'Failed to update item' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Update addons if specified
        if (item.addons) {
          // Remove existing addons
          await supabase
            .from('order_addons')
            .delete()
            .eq('order_item_id', item.itemId);

          // Add new addons
          for (const addon of item.addons) {
            const { data: addonData, error: addonError } = await supabase
              .from('addons')
              .select('price')
              .eq('id', addon.addonId)
              .single();

            if (addonError || !addonData) {
              console.error(`Addon ${addon.addonId} not found`);
              continue;
            }

            await supabase
              .from('order_addons')
              .insert({
                order_item_id: item.itemId,
                addon_id: addon.addonId,
                quantity: addon.quantity,
                unit_price: addonData.price
              });
          }
        }

      } else if (item.action === 'remove') {
        // Verify item belongs to this order
        const { data: existingItem, error: itemError } = await supabase
          .from('order_items')
          .select('id')
          .eq('id', item.itemId)
          .eq('order_id', orderId)
          .single();

        if (itemError || !existingItem) {
          return new Response(
            JSON.stringify({ error: `Item ${item.itemId} not found in this order` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Remove addons first (foreign key constraint)
        await supabase
          .from('order_addons')
          .delete()
          .eq('order_item_id', item.itemId);

        // Remove the item
        const { error: removeError } = await supabase
          .from('order_items')
          .delete()
          .eq('id', item.itemId);

        if (removeError) {
          console.error('Error removing item:', removeError);
          return new Response(
            JSON.stringify({ error: 'Failed to remove item' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Recalculate order totals
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        total_price,
        order_addons(unit_price, quantity)
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching items for total calculation:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to recalculate totals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subtotal = 0;
    
    // Calculate subtotal including items and addons
    for (const orderItem of orderItems) {
      subtotal += parseFloat(orderItem.total_price);
      
      // Add addon costs
      if (orderItem.order_addons) {
        for (const addon of orderItem.order_addons) {
          subtotal += parseFloat(addon.unit_price) * addon.quantity;
        }
      }
    }

    // Calculate tax (assume 8.25% for now)
    const taxAmount = subtotal * 0.0825;
    const totalAmount = subtotal + taxAmount;

    // Update order totals
    const { error: totalUpdateError } = await supabase
      .from('orders')
      .update({
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount
      })
      .eq('id', orderId);

    if (totalUpdateError) {
      console.error('Error updating order totals:', totalUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order totals' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ TRIGGERS WILL AUTOMATICALLY UPDATE chatbot_orders_flat

    // Wait a moment for triggers to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch the updated order from the flat table
    const { data: updatedOrderData, error: fetchUpdatedError } = await supabase
      .from('chatbot_orders_flat')
      .select('*')
      .eq('order_id', orderId)
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
          lastUpdated: updatedOrderData.last_updated,
          summary: `Order ${currentOrder.order_number} items updated successfully. New total: $${totalAmount.toFixed(2)}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Streamlined response
    const order = updatedOrderData.order_data;
    const streamlined = {
      order: {
        orderNumber: order.order_info?.order_number,
        status: order.order_info?.status,
        total: `$${order.order_info?.total_amount}`,
        subtotal: `$${order.order_info?.subtotal}`,
        tax: `$${order.order_info?.tax_amount}`,
        itemCount: order.items?.length || 0,
        items: order.items?.map((item: any) => ({
          product: item.product_name,
          option: item.option_name,
          price: `$${item.unit_price}`,
          quantity: item.quantity,
          total: `$${item.total_price}`,
          addons: item.addons?.map((addon: any) => `${addon.name} (${addon.quantity}x)`) || []
        })) || [],
        delivery: order.delivery_info ? {
          address: order.delivery_info.address,
          instructions: order.delivery_info.instructions
        } : null
      },
      summary: `Order ${currentOrder.order_number} items updated successfully. New total: $${totalAmount.toFixed(2)}`
    };

    return new Response(
      JSON.stringify(streamlined),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 