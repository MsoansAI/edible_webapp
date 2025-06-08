import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// V3: Find existing item with the same product and option for intelligent 'add'
async function findExistingItem(supabase: SupabaseClient, cartId: string, productId: string, productOptionId: string | null) {
  let query = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId);
  
  if (productOptionId) {
    query = query.eq('product_option_id', productOptionId);
  } else {
    query = query.is('product_option_id', null);
  }
  
  const { data, error } = await query.limit(1).single();
  
  if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (no rows)
    console.error('Error finding existing item:', error);
  }
  
  return data;
}

// V2: Main Deno serve function
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // --- Rate Limiting ---
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('api_rate_limits')
      .select('request_count')
      .eq('identifier', clientIP)
      .eq('endpoint', 'cart-manager')
      .gte('window_start', new Date(Date.now() - 60000).toISOString())
      .single();

    if (rateLimitData && rateLimitData.request_count >= 30) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError);
    } else {
      await supabase.from('api_rate_limits').upsert({
        identifier: clientIP,
        endpoint: 'cart-manager',
        request_count: (rateLimitData?.request_count || 0) + 1,
        window_start: new Date().toISOString()
      }, { onConflict: 'identifier, endpoint' });
    }

    // --- Routing ---
    const url = new URL(req.url);
    const cartId = url.searchParams.get('cartId');
    const createNew = url.searchParams.get('new') === 'true';

    // GET /?cartId=<uuid> - Retrieve cart details
    if (req.method === 'GET' && cartId) {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          id,
          created_at,
          updated_at,
          cart_items (
            id,
            quantity,
            products (id, name, base_price, images),
            product_options (id, option_name, price)
          )
        `)
        .eq('id', cartId)
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /?new=true - Create a new cart
    if (req.method === 'POST' && createNew) {
      const { data, error } = await supabase
        .from('carts')
        .insert({})
        .select()
        .single();
        
      if (error) throw error;
      
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST / - Add/update item in cart
    if (req.method === 'POST') {
      const { cartId, productId, productOptionId, quantity } = await req.json();
      
      if (!cartId || !productId || !quantity) {
        return new Response(JSON.stringify({ error: 'cartId, productId, and quantity are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // V3: Check for existing item with the same product and option
      const existingItem = await findExistingItem(supabase, cartId, productId, productOptionId);

      if (existingItem) {
        // Item exists, update its quantity
        const newQuantity = existingItem.quantity + quantity;
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) throw error;
        
        // V3: Also update the cart's updated_at timestamp
        await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } else {
        // Item does not exist, add it
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            product_option_id: productOptionId,
            quantity: quantity,
          })
          .select()
          .single();
        
        if (error) throw error;

        // V3: Also update the cart's updated_at timestamp
        await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);

        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // DELETE / - Remove item from cart
    if (req.method === 'DELETE') {
      const { cartId, itemId } = await req.json();

      if (!cartId || !itemId) {
        return new Response(JSON.stringify({ error: 'cartId and itemId are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('cart_id', cartId);
        
      if (error) throw error;

      // V3: Also update the cart's updated_at timestamp
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId);
      
      return new Response(JSON.stringify({ success: true, message: 'Item removed from cart' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Cart manager error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 