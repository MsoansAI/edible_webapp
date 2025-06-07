import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileRequest {
  action: 'get_profile' | 'get_recommendations' | 'get_order_history'
  userId?: string
  email?: string
  phone?: string
  authUserId?: string
  limit?: number
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

    const { action, userId, email, phone, authUserId, limit = 10 }: ProfileRequest = await req.json()

    // Find customer by any identifier
    let customer = null
    if (userId) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single()
      customer = data
    } else if (authUserId) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()
      customer = data
    } else if (email) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single()
      customer = data
    } else if (phone) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()
      customer = data
    }

    if (!customer) {
      return new Response(
        JSON.stringify({
          error: 'customer_not_found',
          message: 'No customer found with provided identifier',
          authenticated: false
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    switch (action) {
      case 'get_profile':
        return await getFullProfile(supabase, customer)
      
      case 'get_order_history': 
        return await getOrderHistory(supabase, customer.id, limit)
        
      case 'get_recommendations':
        return await getPersonalizedRecommendations(supabase, customer)
        
      default:
        return new Response(
          JSON.stringify({ error: 'invalid_action', message: 'Action must be get_profile, get_order_history, or get_recommendations' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Error in user-profile function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'server_error', 
        message: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getFullProfile(supabase: any, customer: any) {
  // Get order statistics
  const { data: orderStats } = await supabase
    .rpc('get_customer_order_stats', { customer_uuid: customer.id })

  // Get recent orders with details
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      scheduled_date,
      fulfillment_type,
      order_items (
        quantity,
        products (name, product_identifier),
        product_options (option_name)
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get saved addresses
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })

  const { data: recipientAddresses } = await supabase
    .from('recipient_addresses')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate customer tier
  const orderCount = orderStats?.[0]?.total_orders || 0
  const totalSpent = orderStats?.[0]?.total_spent || 0
  
  let tier = 'new'
  let role = 'authenticated'
  
  if (orderCount >= 10 && totalSpent >= 500) {
    tier = 'premium'
    role = 'premium'
  } else if (orderCount >= 5 || totalSpent >= 250) {
    tier = 'vip'
    role = 'vip'
  } else if (orderCount >= 1) {
    tier = 'returning'
    role = 'returning'
  }

  const profile = {
    id: customer.id,
    name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    allergies: customer.allergies || [],
    dietaryRestrictions: customer.dietary_restrictions || [],
    preferences: customer.preferences || {},
    tier,
    role,
    stats: {
      totalOrders: orderCount,
      totalSpent: totalSpent.toFixed(2),
      memberSince: customer.created_at,
      lastOrderDate: customer.last_order_at
    },
    authenticated: true
  }

  // Create contextual welcome message
  const welcomeMessage = createWelcomeMessage(profile, recentOrders)

  return new Response(
    JSON.stringify({
      success: true,
      profile,
      recentOrders: formatOrderHistory(recentOrders || []),
      addresses: addresses || [],
      recipientAddresses: recipientAddresses || [],
      welcomeMessage,
      recommendations: await getQuickRecommendations(supabase, customer, recentOrders)
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function getOrderHistory(supabase: any, customerId: string, limit: number) {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_amount,
      created_at,
      scheduled_date,
      fulfillment_type,
      special_instructions,
      order_items (
        quantity,
        unit_price,
        total_price,
        products (name, product_identifier, image_url),
        product_options (option_name, price),
        order_addons (
          quantity,
          unit_price,
          addons (name)
        )
      ),
      recipient_addresses (
        recipient_name,
        street_address,
        city,
        state,
        zip_code
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return new Response(
    JSON.stringify({
      success: true,
      orderHistory: formatDetailedOrderHistory(orders || []),
      summary: `Found ${orders?.length || 0} orders`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function getPersonalizedRecommendations(supabase: any, customer: any) {
  // Get customer's order patterns
  const { data: orderPatterns } = await supabase
    .from('orders')
    .select(`
      order_items (
        products (
          id,
          name,
          product_identifier,
          categories:product_categories(categories(name, type))
        )
      )
    `)
    .eq('customer_id', customer.id)
    .limit(20)

  // Extract preferred categories and occasions
  const preferences = analyzeOrderPatterns(orderPatterns || [])
  
  // Get recommended products based on preferences
  const { data: recommendations } = await supabase
    .from('products')
    .select(`
      id,
      product_identifier,
      name,
      description,
      base_price,
      image_url,
      is_active,
      product_options (option_name, price)
    `)
    .eq('is_active', true)
    .limit(6)

  return new Response(
    JSON.stringify({
      success: true,
      recommendations: recommendations || [],
      preferences,
      message: `Based on your order history, here are some personalized recommendations`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

function createWelcomeMessage(profile: any, recentOrders: any[]): string {
  const firstName = profile.firstName || 'valued customer'
  let message = `Welcome back, ${firstName}! `

  if (profile.stats.totalOrders === 0) {
    message += "I'm excited to help you create your first order with us!"
  } else {
    message += `You've been a ${profile.tier} customer with ${profile.stats.totalOrders} orders totaling $${profile.stats.totalSpent}.`
    
    if (recentOrders.length > 0) {
      const lastOrder = recentOrders[0]
      const daysSince = Math.floor((new Date().getTime() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSince <= 30) {
        message += ` Your recent order (${lastOrder.order_number}) was ${daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${daysSince} days ago`}.`
      }
    }
  }

  if (profile.allergies.length > 0) {
    message += ` I have your allergies noted (${profile.allergies.join(', ')}) and will check all products for safety.`
  }

  return message
}

function formatOrderHistory(orders: any[]): any[] {
  return orders.map(order => {
    const items = order.order_items?.map((item: any) => {
      const product = item.products?.name || 'Unknown Product'
      const option = item.product_options?.option_name ? ` - ${item.product_options.option_name}` : ''
      const quantity = item.quantity > 1 ? ` (${item.quantity}x)` : ''
      return `${product}${option}${quantity}`
    }).join(', ') || 'No items'

    return {
      orderNumber: order.order_number,
      status: order.status,
      total: order.total_amount,
      date: order.created_at,
      scheduledDate: order.scheduled_date,
      fulfillmentType: order.fulfillment_type,
      itemsSummary: items
    }
  })
}

function formatDetailedOrderHistory(orders: any[]): any[] {
  return orders.map(order => ({
    ...formatOrderHistory([order])[0],
    details: {
      items: order.order_items?.map((item: any) => ({
        productName: item.products?.name,
        productId: item.products?.product_identifier,
        option: item.product_options?.option_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        addons: item.order_addons?.map((addon: any) => ({
          name: addon.addons?.name,
          quantity: addon.quantity,
          price: addon.unit_price
        })) || []
      })) || [],
      deliveryAddress: order.recipient_addresses ? {
        recipientName: order.recipient_addresses.recipient_name,
        address: `${order.recipient_addresses.street_address}, ${order.recipient_addresses.city}, ${order.recipient_addresses.state} ${order.recipient_addresses.zip_code}`
      } : null,
      specialInstructions: order.special_instructions
    }
  }))
}

function analyzeOrderPatterns(orders: any[]): any {
  const categories: any = {}
  const occasions: any = {}
  
  orders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      item.products?.categories?.forEach((cat: any) => {
        const categoryName = cat.categories?.name
        if (categoryName) {
          categories[categoryName] = (categories[categoryName] || 0) + 1
        }
      })
    })
  })

  return {
    favoriteCategories: Object.entries(categories)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([name]) => name),
    orderFrequency: orders.length > 5 ? 'frequent' : orders.length > 2 ? 'regular' : 'occasional'
  }
}

async function getQuickRecommendations(supabase: any, customer: any, recentOrders: any[]): Promise<string[]> {
  const suggestions = []
  
  if (recentOrders.length === 0) {
    suggestions.push("Browse our bestselling arrangements")
    suggestions.push("Explore seasonal collections")
  } else {
    suggestions.push("Reorder a previous favorite")
    suggestions.push("Try something new based on your preferences")
  }
  
  if (customer.allergies?.length > 0) {
    suggestions.push("View allergy-safe options")
  }
  
  return suggestions
} 