import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

interface CartRequest {
  action: 'add' | 'get' | 'update' | 'remove' | 'clear' | 'summary' | 'validate'
  productId?: string           // ⭐ ENHANCED: Supports both 4-digit ID (e.g., "3075") and UUID
  optionId?: string           // Legacy UUID support for web apps
  optionName?: string         // ⭐ NEW: Voice-friendly option name (e.g., "Large", "Small")
  quantity?: number
  cartData?: any
}

// ⭐ NEW: Helper function to resolve 4-digit product ID to UUID
async function resolveProductId(supabase: any, productIdentifier: string): Promise<string | null> {
  // Check if it's a 4-digit number
  const parsed = parseInt(productIdentifier);
  if (!isNaN(parsed) && parsed >= 1000 && parsed <= 9999) {
    // It's a 4-digit identifier, look up the UUID
    const { data: product, error } = await supabase
      .from('products')
      .select('id')
      .eq('product_identifier', parsed)
      .eq('is_active', true)
      .single();
    
    if (error || !product) {
      console.log(`❌ Product with 4-digit ID ${parsed} not found`);
      return null;
    }
    console.log(`✅ Resolved 4-digit ID ${parsed} to UUID ${product.id}`);
    return product.id;
  }
  
  // Assume it's already a UUID - validate it exists
  const { data: product, error } = await supabase
    .from('products')
    .select('id')
    .eq('id', productIdentifier)
    .eq('is_active', true)
    .single();
  
  if (error || !product) {
    console.log(`❌ Product UUID ${productIdentifier} not found`);
    return null;
  }
  return product.id;
}

// ⭐ NEW: Helper function to resolve option name to option ID
async function resolveOptionByName(
  supabase: any, 
  productId: string, 
  optionName: string
): Promise<{ id: string; price: string; availableOptions?: string[] } | null> {
  console.log(`🔍 Looking for option "${optionName}" for product ${productId}`);
  
  const { data: options, error } = await supabase
    .from('product_options')
    .select('id, option_name, price')
    .eq('product_id', productId)
    .eq('is_available', true);
  
  if (error || !options || options.length === 0) {
    console.log(`❌ No options found for product ${productId}`);
    return null;
  }
  
  console.log(`📋 Available options for product ${productId}:`, options.map(o => o.option_name));
  
  // Find option by exact name match (case-insensitive)
  const matchingOption = options.find(option => 
    option.option_name.toLowerCase() === optionName.toLowerCase()
  );
  
  if (matchingOption) {
    console.log(`✅ Found matching option: ${matchingOption.option_name} -> ${matchingOption.id}`);
    return {
      id: matchingOption.id,
      price: matchingOption.price
    };
  }
  
  console.log(`❌ No matching option found for "${optionName}"`);
  // Return available options for better error messages
  return {
    id: '',
    price: '',
    availableOptions: options.map(o => o.option_name)
  };
}

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

    // ⭐ ENHANCED: Support action-based API for voice bots
    const requestData = await req.json();
    const { action, productId, optionId, optionName, quantity = 1, cartData }: CartRequest = requestData;

    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Action is required. Supported: add, get, validate, summary',
          supportedActions: ['add', 'get', 'validate', 'summary'],
          examples: {
            get: { action: 'get', productId: '3075' },
            add: { action: 'add', productId: '3075', optionName: 'Large', quantity: 1 },
            validate: { action: 'validate', cartData: { items: [] } },
            summary: { action: 'summary', cartData: { items: [] } }
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    switch (action) {
      case 'validate':
        // Validate cart items against database
        if (!cartData || !cartData.items) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'No cart data provided' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }

        const productIds = cartData.items.map((item: any) => item.product.id);
        const optionIds = cartData.items
          .filter((item: any) => item.option)
          .map((item: any) => item.option.id);

        // Validate products exist and are active
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id, name, base_price, is_active')
          .in('id', productIds)
          .eq('is_active', true);

        if (productError) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Error validating products',
              error: productError 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

        // Validate options if any
        let options = [];
        if (optionIds.length > 0) {
          const { data: optionsData, error: optionError } = await supabase
            .from('product_options')
            .select('id, product_id, option_name, price, is_available')
            .in('id', optionIds)
            .eq('is_available', true);

          if (optionError) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: 'Error validating options',
                error: optionError 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500 
              }
            );
          }
          options = optionsData || [];
        }

        // Check for invalid items
        const validProductIds = new Set(products?.map(p => p.id) || []);
        const validOptionIds = new Set(options.map(o => o.id));
        
        const invalidItems = cartData.items.filter((item: any) => {
          const productValid = validProductIds.has(item.product.id);
          const optionValid = !item.option || validOptionIds.has(item.option.id);
          return !productValid || !optionValid;
        });

        return new Response(
          JSON.stringify({
            success: true,
            validation: {
              isValid: invalidItems.length === 0,
              validProducts: products?.length || 0,
              validOptions: options.length,
              invalidItems: invalidItems.map((item: any) => ({
                productId: item.product.id,
                productName: item.product.name,
                optionId: item.option?.id,
                reason: !validProductIds.has(item.product.id) 
                  ? 'Product not found or inactive'
                  : 'Option not found or unavailable'
              }))
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        // ⭐ ENHANCED: Get product details with voice-friendly resolution
        if (!productId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product ID required (use 4-digit ID like "3075" or UUID)' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }

        // ⭐ NEW: Resolve 4-digit ID to UUID
        const resolvedProductId = await resolveProductId(supabase, productId);
        if (!resolvedProductId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Product ${productId} not found or inactive`,
              hint: 'Use 4-digit product ID (e.g., "3075") or valid UUID'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404 
            }
          );
        }

        const { data: product, error: getError } = await supabase
          .from('products')
          .select(`
            id,
            product_identifier,
            name,
            description,
            base_price,
            image_url,
            is_active,
            product_options (
              id,
              option_name,
              price,
              description,
              image_url,
              is_available
            )
          `)
          .eq('id', resolvedProductId)
          .eq('is_active', true)
          .single();

        if (getError || !product) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product not found or inactive',
              error: getError 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404 
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            product: {
              ...product,
              availableOptions: product.product_options?.filter((opt: any) => opt.is_available) || []
            },
            action: 'product_details',
            data: {
              clientAction: {
                type: 'SHOW_PRODUCT_DETAILS',
                payload: { product }
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'add':
        // ⭐ ENHANCED: Add item to cart with voice-friendly identifiers
        if (!productId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product ID required for adding to cart (use 4-digit ID like "3075" or UUID)' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }

        // ⭐ NEW: Resolve 4-digit ID to UUID
        const addResolvedProductId = await resolveProductId(supabase, productId);
        if (!addResolvedProductId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Product ${productId} not found or inactive`,
              hint: 'Use 4-digit product ID (e.g., "3075") or valid UUID'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404 
            }
          );
        }

        // Validate product exists
        const { data: addProduct, error: addError } = await supabase
          .from('products')
          .select('*')
          .eq('id', addResolvedProductId)
          .eq('is_active', true)
          .single();

        if (addError || !addProduct) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product not found or inactive' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404 
            }
          );
        }

        // ⭐ ENHANCED: Handle both optionId (UUID) and optionName (voice-friendly)
        let option = null;
        let finalOptionId = optionId; // Default to UUID if provided

        if (optionName && !optionId) {
          // Voice bot using option name - resolve to UUID
          const optionData = await resolveOptionByName(supabase, addResolvedProductId, optionName);
          
          if (!optionData || !optionData.id) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: `Option "${optionName}" not found for product ${productId}`,
                availableOptions: optionData?.availableOptions || [],
                hint: `Available options: ${(optionData?.availableOptions || []).join(', ')}`
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400 
              }
            );
          }

          finalOptionId = optionData.id;
          console.log(`✅ Using option "${optionName}" resolved to UUID ${finalOptionId}`);
        }

        // Validate option if provided (either UUID or resolved from name)
        if (finalOptionId) {
          const { data: optionData, error: optionError } = await supabase
            .from('product_options')
            .select('*')
            .eq('id', finalOptionId)
            .eq('product_id', addResolvedProductId)
            .eq('is_available', true)
            .single();

          if (optionError || !optionData) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: 'Option not found or unavailable' 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404 
              }
            );
          }
          option = optionData;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Added ${quantity} ${addProduct.name}${option ? ` (${option.option_name})` : ''} to cart`,
            action: 'add_to_cart',
            data: {
              product: {
                ...addProduct,
                productId: addProduct.product_identifier // ⭐ Include 4-digit ID for voice bots
              },
              option: option ? {
                ...option,
                displayName: option.option_name // ⭐ Voice-friendly display name
              } : null,
              quantity: quantity,
              clientAction: {
                type: 'ADD_TO_CART',
                payload: { 
                  product: addProduct, 
                  option: option, 
                  quantity: quantity 
                }
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'summary':
        // ⭐ ENHANCED: Provide voice-friendly cart summary
        if (!cartData || !cartData.items) {
          return new Response(
            JSON.stringify({
              success: true,
              summary: {
                itemCount: 0,
                subtotal: 0,
                tax: 0,
                shipping: 0,
                total: 0,
                freeShippingEligible: false,
                items: [],
                message: 'Your cart is empty'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const subtotal = cartData.items.reduce((total: number, item: any) => {
          const price = item.option ? item.option.price : item.product.base_price;
          return total + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.0825;
        const shipping = subtotal >= 65 ? 0 : 9.99;
        const total = subtotal + tax + shipping;

        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              itemCount: cartData.items.reduce((count: number, item: any) => count + item.quantity, 0),
              subtotal: Math.round(subtotal * 100) / 100,
              tax: Math.round(tax * 100) / 100,
              shipping: shipping,
              total: Math.round(total * 100) / 100,
              freeShippingEligible: subtotal >= 65,
              items: cartData.items.map((item: any) => ({
                name: item.product.name,
                productId: item.product.product_identifier || item.product.id.slice(-4), // ⭐ Include 4-digit ID
                option: item.option?.option_name || item.option?.displayName, // ⭐ Voice-friendly option name
                quantity: item.quantity,
                price: item.option ? item.option.price : item.product.base_price,
                total: Math.round((item.option ? item.option.price : item.product.base_price) * item.quantity * 100) / 100
              })),
              message: `You have ${cartData.items.length} different item${cartData.items.length !== 1 ? 's' : ''} in your cart. Total: $${Math.round(total * 100) / 100}`
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid action. Supported: add, get, validate, summary',
            supportedActions: ['add', 'get', 'validate', 'summary'],
            examples: {
              get: { action: 'get', productId: '3075' },
              add: { action: 'add', productId: '3075', optionName: 'Large', quantity: 1 },
              validate: { action: 'validate', cartData: { items: [] } },
              summary: { action: 'summary', cartData: { items: [] } }
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }

  } catch (error: any) {
    console.error('Cart manager error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 