import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS'
};
// Helper function to resolve customer by phone number (E164 format)
async function resolveCustomerId(supabase, customerIdentifier) {
  if (!customerIdentifier) return null;
  
  // Check if it's a UUID pattern (8-4-4-4-12 characters)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(customerIdentifier)) {
    // It's a UUID, validate it exists
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerIdentifier)
      .single();
    return error ? null : data?.id;
  } else {
    // Assume it's a phone number (E164 format starting with +)
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', customerIdentifier)
      .single();
    return error ? null : data?.id;
  }
}
// Helper function to resolve franchisee by store number
async function resolveFranchiseeId(supabase, franchiseeIdentifier) {
  if (!franchiseeIdentifier) return null;
  
  // Check if it's a UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(franchiseeIdentifier)) {
    // It's a UUID, validate it exists
    const { data, error } = await supabase
      .from('franchisees')
      .select('id')
      .eq('id', franchiseeIdentifier)
      .single();
    if (error || !data) return null;
    return franchiseeIdentifier;
  }
  
  // It's a store number (handle both string and number)
  const storeNumber = parseInt(String(franchiseeIdentifier), 10);
  if (isNaN(storeNumber) || storeNumber <= 0) return null;
  
  const { data, error } = await supabase
    .from('franchisees')
    .select('id')
    .eq('store_number', storeNumber)
    .single();
  if (error || !data) return null;
  return data.id;
}
// Helper function to resolve product option by name or UUID
async function resolveProductOptionId(supabase, productId, optionIdentifier) {
  if (!optionIdentifier) return null;
  
  // Check if it's a UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(optionIdentifier)) {
    // It's a UUID, validate it exists
    const { data, error } = await supabase
      .from('product_options')
      .select('id')
      .eq('id', optionIdentifier)
      .eq('product_id', productId)
      .single();
    return error ? null : data?.id;
  } else {
    // Assume it's an option name (e.g., "Large", "Small")
    const { data, error } = await supabase
      .from('product_options')
      .select('id')
      .eq('product_id', productId)
      .ilike('option_name', optionIdentifier)
      .single();
    return error ? null : data?.id;
  }
}
// Helper function to resolve product ID (4-digit to UUID)
async function resolveProductId(supabase, productId) {
  if (!productId) return null;
  
  // Try parsing as 4-digit identifier (handle both string and number)
  const parsed = parseInt(String(productId), 10);
  if (!isNaN(parsed) && parsed >= 1000 && parsed <= 9999) {
    // 4-digit product identifier
    const { data, error } = await supabase.from('products').select('id').eq('product_identifier', parsed).eq('is_active', true).single();
    if (error || !data) return null;
    return data.id;
  }
  
  // Assume UUID - validate it exists and is active
  const { data, error } = await supabase.from('products').select('id').eq('id', String(productId)).eq('is_active', true).single();
  if (error || !data) return null;
  return data.id;
}
// Helper function to generate order number
async function generateOrderNumber(supabase, franchiseeId) {
  // Get franchisee store number
  const { data: franchisee, error: franchiseeError } = await supabase.from('franchisees').select('store_number').eq('id', franchiseeId).single();
  if (franchiseeError || !franchisee) {
    throw new Error('Franchisee not found');
  }
  
  // Get next sequence number for this store
  const { data: lastOrder, error: orderError } = await supabase.from('orders').select('order_number').like('order_number', `W${franchisee.store_number}%`).order('created_at', {
    ascending: false
  }).limit(1);
  let sequence = 1;
  if (!orderError && lastOrder && lastOrder.length > 0) {
    const lastOrderNumber = lastOrder[0].order_number;
    // Extract sequence from format W[store][sequence]-1: W25700000001-1 -> 00000001
    const storeNumStr = franchisee.store_number.toString();
    const pattern = new RegExp(`W${storeNumStr}(\\\\d{8})-1`);
    const match = lastOrderNumber.match(pattern);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }
  // Format: W[store_number][8-digit-sequence]-1
  const sequenceStr = sequence.toString().padStart(8, '0');
  return `W${franchisee.store_number}${sequenceStr}-1`;
}
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { data: rateLimitData, error: rateLimitError } = await supabase.from('api_rate_limits').select('request_count').eq('identifier', clientIP).eq('endpoint', 'order').gte('window_start', new Date(Date.now() - 60000).toISOString()).single();
    if (rateLimitData && rateLimitData.request_count >= 20) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment.',
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }
    // Log the request for rate limiting
    await supabase.from('api_rate_limits').upsert({
      identifier: clientIP,
      endpoint: 'order',
      request_count: (rateLimitData?.request_count || 0) + 1,
      window_start: new Date().toISOString()
    });
    const method = req.method;
    const url = new URL(req.url);
    if (method === 'GET') {
      // GET: Retrieve orders
      const customerId = url.searchParams.get('customerId');
      const orderNumber = url.searchParams.get('orderNumber');
      const outputType = url.searchParams.get('outputType') || 'streamlined';
      if (!customerId && !orderNumber) {
        return new Response(JSON.stringify({
          error: 'Either customerId or orderNumber is required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      let query;
      if (customerId) {
        // Get most recent order for customer by joining with orders table
        query = supabase.from('chatbot_orders_flat').select('*, orders!inner(customer_id)').eq('orders.customer_id', customerId).order('last_updated', {
          ascending: false
        }).limit(1);
      } else if (orderNumber) {
        // Search by last 4 digits of order number (more precise pattern)
        query = supabase.from('chatbot_orders_flat').select('*').like('order_data->order_info->>order_number', `%${orderNumber}-%`);
      }
      const { data: orderData, error: orderError } = await query;
      if (orderError || !orderData || orderData.length === 0) {
        return new Response(JSON.stringify({
          error: 'Order not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const order = orderData[0];
      if (outputType === 'json') {
        return new Response(JSON.stringify({
          order: order,
          orderId: order.order_data?.order_info?.id,
          lastUpdated: order.last_updated
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Streamlined format
      const streamlined = {
        order: {
          orderNumber: order.order_data?.order_info?.order_number,
          status: order.order_data?.order_info?.status,
          total: `$${order.order_data?.order_info?.total_amount}`,
          estimatedDelivery: `${order.order_data?.order_info?.scheduled_date} ${order.order_data?.order_info?.scheduled_time_slot}`,
          items: order.order_data?.items?.map((item)=>({
              product: item.product_name,
              product_id: item.product_identifier,
              price: `$${item.unit_price}`,
              quantity: item.quantity,
              addons: item.addons || []
            })) || [],
          delivery: order.order_data?.delivery_info ? {
            address: order.order_data.delivery_info.address,
            instructions: order.order_data.delivery_info.instructions
          } : null
        },
        summary: `Found order ${order.order_data?.order_info?.order_number} for you.`
      };
      return new Response(JSON.stringify(streamlined), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (method === 'POST') {
      // POST: Create new order
      const requestData = await req.json();
      console.log('Received request data:', JSON.stringify(requestData, null, 2));
      
      const { customerId, customerPhone, franchiseeId, storeNumber, items, deliveryAddress, pickupTime, scheduledDate, scheduledTimeSlot, specialInstructions, outputType = 'streamlined' } = requestData;
      
      // Support voice-friendly identifiers
      const resolvedCustomerId = await resolveCustomerId(supabase, customerId || customerPhone);
      const resolvedFranchiseeId = await resolveFranchiseeId(supabase, franchiseeId || storeNumber);
      
      console.log('Resolution results:', {
        customerInput: customerId || customerPhone,
        resolvedCustomerId,
        storeInput: franchiseeId || storeNumber,
        resolvedFranchiseeId,
        items: items ? `array of ${items.length} items` : 'missing/invalid',
        isArray: Array.isArray(items)
      });
      
      // Validation
      if (!resolvedCustomerId || !resolvedFranchiseeId || !items || !Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({
          error: 'Customer, store, and items array are required',
          hint: 'Use customerId (UUID) or customerPhone (E164), franchiseeId (UUID) or storeNumber (integer)',
          example: {
            customerPhone: '+14155551234',
            storeNumber: 101,
            items: [
              {
                productId: '3075',
                quantity: 1
              }
            ]
          }
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const fulfillmentType = deliveryAddress ? 'delivery' : 'pickup';
      if (fulfillmentType === 'delivery' && !deliveryAddress?.street) {
        return new Response(JSON.stringify({
          error: 'deliveryAddress with street is required for delivery orders'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Verify customer exists
      const { data: customer, error: customerError } = await supabase.from('customers').select('id, email, first_name, last_name').eq('id', resolvedCustomerId).single();
      if (customerError || !customer) {
        return new Response(JSON.stringify({
          error: 'Customer not found'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Verify franchisee exists
      const { data: franchisee, error: franchiseeError } = await supabase.from('franchisees').select('id, name, store_number').eq('id', resolvedFranchiseeId).single();
      if (franchiseeError || !franchisee) {
        return new Response(JSON.stringify({
          error: 'Franchisee not found'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Generate order number
      const orderNumber = await generateOrderNumber(supabase, resolvedFranchiseeId);
      // Create recipient address if delivery
      let recipientAddressId = null;
      if (fulfillmentType === 'delivery') {
        const { data: recipientAddress, error: addressError } = await supabase.from('recipient_addresses').insert({
          customer_id: resolvedCustomerId,
          recipient_name: deliveryAddress.recipientName || `${customer.first_name} ${customer.last_name}`,
          recipient_phone: deliveryAddress.recipientPhone || '',
          street_address: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip_code: deliveryAddress.zipCode,
          delivery_instructions: deliveryAddress.specialInstructions || ''
        }).select('id').single();
        if (addressError) {
          console.error('Error creating recipient address:', addressError);
          return new Response(JSON.stringify({
            error: 'Failed to create delivery address'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        recipientAddressId = recipientAddress.id;
      }
      // Calculate order totals
      let subtotal = 0;
      const processedItems = [];
      for (const item of items){
        // Resolve product ID
        const resolvedProductId = await resolveProductId(supabase, item.productId);
        if (!resolvedProductId) {
          return new Response(JSON.stringify({
            error: `Product ${item.productId} not found or inactive`,
            hint: "Use 4-digit product ID (e.g., '3075') or valid product UUID"
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        // Get product information
        const { data: productData, error: productError } = await supabase.from('products').select('id, base_price, name, product_identifier').eq('id', resolvedProductId).single();
        if (productError || !productData) {
          return new Response(JSON.stringify({
            error: `Product ${item.productId} not found`
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        let unitPrice = productData.base_price;
        let resolvedProductOptionId = null;
        
        // Handle product option with voice-friendly resolution
        if (item.productOptionId) {
          resolvedProductOptionId = await resolveProductOptionId(supabase, resolvedProductId, item.productOptionId);
          if (!resolvedProductOptionId) {
            return new Response(JSON.stringify({
              error: `Product option ${item.productOptionId} not found for product ${item.productId}`
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          
          const { data: optionData, error: optionError } = await supabase.from('product_options').select('price, option_name').eq('id', resolvedProductOptionId).single();
          if (optionError || !optionData) {
            return new Response(JSON.stringify({
              error: `Product option ${item.productOptionId} not found`
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
          unitPrice = optionData.price;
        }
        const totalPrice = parseFloat(unitPrice) * item.quantity;
        subtotal += totalPrice;
        processedItems.push({
          productId: resolvedProductId,
          productOptionId: resolvedProductOptionId,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          addons: item.addons || []
        });
      }
      // Calculate tax (8.25%)
      const taxAmount = subtotal * 0.0825;
      const totalAmount = subtotal + taxAmount;
      // Create order
      const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
        customer_id: resolvedCustomerId,
        franchisee_id: resolvedFranchiseeId,
        recipient_address_id: recipientAddressId,
        order_number: orderNumber,
        status: 'pending',
        fulfillment_type: fulfillmentType,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        scheduled_date: scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scheduled_time_slot: scheduledTimeSlot || (fulfillmentType === 'delivery' ? '2:00 PM - 4:00 PM' : pickupTime || '2:00 PM'),
        special_instructions: specialInstructions || ''
      }).select('id').single();
      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(JSON.stringify({
          error: 'Failed to create order',
          details: orderError.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const orderId = newOrder.id;
      // Create order items
      for (const item of processedItems){
        const { data: orderItem, error: itemError } = await supabase.from('order_items').insert({
          order_id: orderId,
          product_id: item.productId,
          product_option_id: item.productOptionId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }).select('id').single();
        if (itemError) {
          console.error('Error creating order item:', itemError);
          return new Response(JSON.stringify({
            error: 'Failed to create order items'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        // Add addons if specified
        if (item.addons && item.addons.length > 0) {
          for (const addon of item.addons){
            const { data: addonData, error: addonError } = await supabase.from('addons').select('price').eq('id', addon.addonId).single();
            if (!addonError && addonData) {
              await supabase.from('order_addons').insert({
                order_item_id: orderItem.id,
                addon_id: addon.addonId,
                quantity: addon.quantity,
                unit_price: addonData.price
              });
            }
          }
        }
      }
      // Wait for triggers to update flat table
      await new Promise((resolve)=>setTimeout(resolve, 200));
      // Fetch the created order
      const { data: createdOrderData, error: fetchError } = await supabase.from('chatbot_orders_flat').select('*').eq('order_id', orderId).single();
      if (fetchError) {
        console.error('Error fetching created order:', fetchError);
        return new Response(JSON.stringify({
          error: 'Order created but could not fetch details',
          orderId: orderId,
          orderNumber: orderNumber
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (outputType === 'json') {
        return new Response(JSON.stringify({
          order: createdOrderData,
          orderId: orderId,
          orderNumber: orderNumber,
          created: true
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Streamlined response
      const streamlined = {
        order: {
          orderNumber: orderNumber,
          status: 'pending',
          total: `$${totalAmount.toFixed(2)}`,
          estimatedDelivery: fulfillmentType === 'delivery' ? `${scheduledDate || 'Tomorrow'} ${scheduledTimeSlot || '2-4 PM'}` : `Pickup ${scheduledDate || 'Tomorrow'} ${scheduledTimeSlot || pickupTime || '2:00 PM'}`,
          items: processedItems.map((item)=>({
              product: createdOrderData.order_data?.items?.find((oi)=>oi.product_id === item.productId)?.product_name || 'Product',
              price: `$${item.unitPrice}`,
              quantity: item.quantity
            })),
          delivery: fulfillmentType === 'delivery' ? {
            address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}`,
            instructions: deliveryAddress.specialInstructions
          } : null
        },
        confirmation: `Perfect! Order ${orderNumber} confirmed for $${totalAmount.toFixed(2)}. ${fulfillmentType === 'delivery' ? `Delivering ${scheduledDate || 'tomorrow'} ${scheduledTimeSlot || '2-4 PM'} to ${deliveryAddress.street}` : `Ready for pickup ${scheduledDate || 'tomorrow'} ${scheduledTimeSlot || pickupTime || '2:00 PM'}`}`
      };
      return new Response(JSON.stringify(streamlined), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else if (method === 'PATCH') {
      // PATCH: Update existing order
      const requestData = await req.json();
      const { orderId, orderNumber, updates, outputType = 'streamlined' } = requestData;
      if (!orderId && !orderNumber) {
        return new Response(JSON.stringify({
          error: 'Either orderId or orderNumber is required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (!updates) {
        return new Response(JSON.stringify({
          error: 'updates object is required'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Find order by either ID or order number
      let orderQuery = supabase.from('orders').select('id, status, order_number');
      if (orderId) {
        orderQuery = orderQuery.eq('id', orderId);
      } else {
        orderQuery = orderQuery.eq('order_number', orderNumber);
      }
      const { data: currentOrder, error: fetchError } = await orderQuery.single();
      if (fetchError || !currentOrder) {
        const searchTerm = orderId ? `ID ${orderId}` : `number ${orderNumber}`;
        return new Response(JSON.stringify({
          error: 'Order not found',
          searchedFor: searchTerm
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      const actualOrderId = currentOrder.id;
      // Check if order can be modified
      if (currentOrder.status === 'shipped' || currentOrder.status === 'delivered') {
        return new Response(JSON.stringify({
          error: 'Order cannot be modified',
          message: `Order ${currentOrder.order_number} is ${currentOrder.status} and cannot be modified.`,
          currentStatus: currentOrder.status
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Update main orders table
      const orderUpdates = {};
      if (updates.scheduled_date) orderUpdates.scheduled_date = updates.scheduled_date;
      if (updates.scheduled_time_slot) orderUpdates.scheduled_time_slot = updates.scheduled_time_slot;
      if (updates.special_instructions) orderUpdates.special_instructions = updates.special_instructions;
      if (updates.pickup_customer_name) orderUpdates.pickup_customer_name = updates.pickup_customer_name;
      if (Object.keys(orderUpdates).length > 0) {
        const { error: orderUpdateError } = await supabase.from('orders').update(orderUpdates).eq('id', actualOrderId);
        if (orderUpdateError) {
          console.error('Error updating orders table:', orderUpdateError);
          return new Response(JSON.stringify({
            error: 'Failed to update order'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      // Update delivery address if provided
      if (updates.delivery_address) {
        const { data: orderData, error: orderFetchError } = await supabase.from('orders').select('recipient_address_id').eq('id', actualOrderId).single();
        if (orderFetchError) {
          console.error('Error fetching order for address update:', orderFetchError);
          return new Response(JSON.stringify({
            error: 'Failed to fetch order for address update'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        if (orderData.recipient_address_id) {
          const addressUpdates = {};
          if (updates.delivery_address.street) addressUpdates.street_address = updates.delivery_address.street;
          if (updates.delivery_address.city) addressUpdates.city = updates.delivery_address.city;
          if (updates.delivery_address.state) addressUpdates.state = updates.delivery_address.state;
          if (updates.delivery_address.zipCode) addressUpdates.zip_code = updates.delivery_address.zipCode;
          if (updates.delivery_address.specialInstructions) addressUpdates.delivery_instructions = updates.delivery_address.specialInstructions;
          const { error: addressUpdateError } = await supabase.from('recipient_addresses').update(addressUpdates).eq('id', orderData.recipient_address_id);
          if (addressUpdateError) {
            console.error('Error updating recipient_addresses table:', addressUpdateError);
            return new Response(JSON.stringify({
              error: 'Failed to update delivery address'
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
        } else {
          return new Response(JSON.stringify({
            error: 'This order does not have a delivery address to update'
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
      // Wait for triggers to update flat table
      await new Promise((resolve)=>setTimeout(resolve, 100));
      // Fetch updated order
      const { data: updatedOrderData, error: fetchUpdatedError } = await supabase.from('chatbot_orders_flat').select('*').eq('order_id', actualOrderId).single();
      if (fetchUpdatedError) {
        console.error('Error fetching updated order:', fetchUpdatedError);
        return new Response(JSON.stringify({
          error: 'Update completed but could not fetch updated order'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (outputType === 'json') {
        return new Response(JSON.stringify({
          order: updatedOrderData,
          orderId: actualOrderId,
          lastUpdated: updatedOrderData.last_updated
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Streamlined response
      const streamlined = {
        order: {
          orderNumber: updatedOrderData.order_data?.order_info?.order_number,
          status: updatedOrderData.order_data?.order_info?.status,
          total: `$${updatedOrderData.order_data?.order_info?.total_amount}`,
          estimatedDelivery: `${updatedOrderData.order_data?.order_info?.scheduled_date} ${updatedOrderData.order_data?.order_info?.scheduled_time_slot}`,
          items: updatedOrderData.order_data?.items?.map((item)=>({
              product: item.product_name,
              product_id: item.product_identifier,
              price: `$${item.unit_price}`,
              quantity: item.quantity,
              addons: item.addons || []
            })) || [],
          delivery: updatedOrderData.order_data?.delivery_info ? {
            address: updatedOrderData.order_data.delivery_info.address,
            instructions: updatedOrderData.order_data.delivery_info.instructions
          } : null
        },
        summary: `Order ${updatedOrderData.order_data?.order_info?.order_number} updated successfully.`
      };
      return new Response(JSON.stringify(streamlined), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        supportedMethods: [
          'GET',
          'POST',
          'PATCH'
        ],
        description: 'Use GET to retrieve orders, POST to create orders, PATCH to update orders.'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

</rewritten_file>