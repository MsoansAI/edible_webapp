import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartRequest {
  action: 'add' | 'get' | 'update' | 'remove' | 'clear' | 'summary' | 'validate'
  productId?: string
  optionId?: string
  quantity?: number
  cartData?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, productId, optionId, quantity = 1, cartData }: CartRequest = await req.json()

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
          )
        }

        const productIds = cartData.items.map((item: any) => item.product.id)
        const optionIds = cartData.items
          .filter((item: any) => item.option)
          .map((item: any) => item.option.id)

        // Validate products exist and are active
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id, name, base_price, is_active')
          .in('id', productIds)
          .eq('is_active', true)

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
          )
        }

        // Validate options if any
        let options = []
        if (optionIds.length > 0) {
          const { data: optionsData, error: optionError } = await supabase
            .from('product_options')
            .select('id, product_id, option_name, price, is_available')
            .in('id', optionIds)
            .eq('is_available', true)

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
            )
          }
          options = optionsData || []
        }

        // Check for invalid items
        const validProductIds = new Set(products?.map(p => p.id) || [])
        const validOptionIds = new Set(options.map(o => o.id))
        
        const invalidItems = cartData.items.filter((item: any) => {
          const productValid = validProductIds.has(item.product.id)
          const optionValid = !item.option || validOptionIds.has(item.option.id)
          return !productValid || !optionValid
        })

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
        )

      case 'get':
        // Get product details for adding to cart
        if (!productId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product ID required' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
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
          .eq('id', productId)
          .eq('is_active', true)
          .single()

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
          )
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
        )

      case 'add':
        // Add item to cart with validation
        if (!productId) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Product ID required for adding to cart' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }

        // Validate product exists
        const { data: addProduct, error: addError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .single()

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
          )
        }

        // Validate option if provided
        let option = null
        if (optionId) {
          const { data: optionData, error: optionError } = await supabase
            .from('product_options')
            .select('*')
            .eq('id', optionId)
            .eq('product_id', productId)
            .eq('is_available', true)
            .single()

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
            )
          }
          option = optionData
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Added ${quantity} ${addProduct.name}${option ? ` (${option.option_name})` : ''} to cart`,
            action: 'add_to_cart',
            data: {
              product: addProduct,
              option: option,
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
        )

      case 'summary':
        // Provide cart summary for chatbot
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
          )
        }

        const subtotal = cartData.items.reduce((total: number, item: any) => {
          const price = item.option ? item.option.price : item.product.base_price
          return total + (price * item.quantity)
        }, 0)
        
        const tax = subtotal * 0.0825
        const shipping = subtotal >= 65 ? 0 : 9.99
        const total = subtotal + tax + shipping

        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              itemCount: cartData.items.reduce((count: number, item: any) => count + item.quantity, 0),
              subtotal: subtotal,
              tax: tax,
              shipping: shipping,
              total: total,
              freeShippingEligible: subtotal >= 65,
              items: cartData.items.map((item: any) => ({
                name: item.product.name,
                option: item.option?.option_name,
                quantity: item.quantity,
                price: item.option ? item.option.price : item.product.base_price,
                total: (item.option ? item.option.price : item.product.base_price) * item.quantity
              })),
              message: `You have ${cartData.items.length} different item${cartData.items.length !== 1 ? 's' : ''} in your cart`
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid action. Supported: add, get, validate, summary' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
    }

  } catch (error) {
    console.error('Cart manager error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 