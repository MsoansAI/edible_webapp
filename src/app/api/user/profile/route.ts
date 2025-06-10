import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProfileRequest {
  userId?: string
  email?: string
  phone?: string
  authUserId?: string
}

interface ProfileUpdateRequest {
  authUserId: string
  firstName?: string
  lastName?: string
  phone?: string
  allergies?: string[]
  dietaryRestrictions?: string[]
  preferences?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: ProfileRequest = await request.json()
    
    if (!body.userId && !body.email && !body.phone && !body.authUserId) {
      return NextResponse.json({
        error: 'Missing identifier',
        message: 'Provide userId, email, phone, or authUserId'
      }, { status: 400 })
    }

    // Build query to find customer
    let query = supabase
      .from('customers')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        allergies,
        dietary_restrictions,
        preferences,
        created_at,
        last_order_at
      `)

    // Add appropriate filter
    if (body.userId) {
      query = query.eq('id', body.userId)
    } else if (body.authUserId) {
      query = query.eq('auth_user_id', body.authUserId)
    } else if (body.email) {
      query = query.eq('email', body.email)
    } else if (body.phone) {
      query = query.eq('phone', body.phone)
    }

    let { data: customer, error: customerError } = await query.single()

    // If no customer found and we have authUserId, create a new customer record
    if (customerError || !customer) {
      if (body.authUserId) {
        // Get the auth user's email from Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(body.authUserId)
        
        if (authUser?.user?.email) {
          // Create new customer record
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              auth_user_id: body.authUserId,
              email: authUser.user.email,
              first_name: '',
              last_name: '',
              phone: '',
              allergies: [],
              dietary_restrictions: [],
              preferences: {}
            })
            .select(`
              id,
              email,
              first_name,
              last_name,
              phone,
              allergies,
              dietary_restrictions,
              preferences,
              created_at,
              last_order_at
            `)
            .single()

          if (createError) {
            console.error('Error creating customer:', createError)
            return NextResponse.json({
              error: 'failed_to_create_customer',
              message: 'Could not create customer profile'
            }, { status: 500 })
          }

          // Continue with the newly created customer
          customer = newCustomer
        } else {
          return NextResponse.json({
            error: 'auth_user_not_found',
            message: 'Could not retrieve authenticated user information'
          }, { status: 404 })
        }
      } else {
        return NextResponse.json({
          error: 'customer_not_found',
          message: 'No customer found with the provided identifier',
          authenticated: false
        }, { status: 404 })
      }
    }

    // Get customer's order history
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        scheduled_date,
        created_at,
        fulfillment_type,
        order_items!inner (
          quantity,
          total_price,
          products!inner (
            name,
            product_identifier
          ),
          product_options (
            option_name
          )
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(10) // Last 10 orders

    // Format order history for easy consumption
    const orderHistory = orders?.map(order => {
      const itemsSummary = order.order_items
        .map((item: any) => {
          const optionName = item.product_options?.option_name
          const productName = item.products?.name
          const quantity = item.quantity > 1 ? ` (${item.quantity}x)` : ''
          return optionName ? `${productName} - ${optionName}${quantity}` : `${productName}${quantity}`
        })
        .join(', ')

      return {
        orderNumber: order.order_number,
        status: order.status,
        total: order.total_amount,
        date: order.created_at,
        scheduledDate: order.scheduled_date,
        fulfillmentType: order.fulfillment_type,
        itemsSummary,
        itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }) || []

    // Get recent addresses for convenience
    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .limit(3)

    const { data: recipientAddresses } = await supabase
      .from('recipient_addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Calculate stats
    const totalSpent = orderHistory.reduce((sum, order) => sum + parseFloat(order.total), 0)
    const tier = orderHistory.length >= 10 ? 'premium' : orderHistory.length >= 5 ? 'vip' : orderHistory.length >= 1 ? 'returning' : 'new'

    // Create profile summary
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
      stats: {
        totalOrders: orderHistory.length,
        totalSpent: totalSpent.toFixed(2),
        memberSince: customer.created_at,
        lastOrderDate: customer.last_order_at || orderHistory[0]?.date
      },
      tier,
      authenticated: true,
      isVip: orderHistory.length >= 5, // 5+ orders = VIP
      role: tier
    }

    // Create contextual summary for chatbot
    const orderCount = orderHistory.length
    const lastOrderDate = orderHistory[0]?.date
    
    let welcomeMessage = `Welcome back, ${profile.firstName || 'valued customer'}! `
    
    if (orderCount === 0) {
      welcomeMessage += "I see this is your first order with us. I'm excited to help you create something special!"
    } else if (orderCount === 1) {
      welcomeMessage += `I see you've ordered with us once before. Welcome back!`
    } else {
      const lastOrderStr = lastOrderDate ? formatDateForSpeech(lastOrderDate) : 'recently'
      welcomeMessage += `You've been a loyal customer with ${orderCount} orders. Your last order was ${lastOrderStr}.`
    }

    if (profile.allergies.length > 0) {
      welcomeMessage += ` I have your allergies noted: ${profile.allergies.join(', ')}. I'll make sure to check all products for you.`
    }

    return NextResponse.json({
      success: true,
      profile,
      orderHistory,
      addresses: addresses || [],
      recipientAddresses: recipientAddresses || [],
      summary: {
        orderCount,
        totalSpent: totalSpent.toFixed(2),
        lastOrderDate,
        welcomeMessage,
        isReturningCustomer: orderCount > 0,
        suggestedActions: getSuggestedActions(profile, orderHistory)
      }
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({
      error: 'server_error',
      message: 'Failed to retrieve user profile'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: ProfileUpdateRequest = await request.json()
    
    if (!body.authUserId) {
      return NextResponse.json({
        error: 'Missing authUserId',
        message: 'AuthUserId is required for profile updates'
      }, { status: 400 })
    }

    // Find the customer record linked to this auth user
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, auth_user_id, email, first_name, last_name, phone')
      .eq('auth_user_id', body.authUserId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({
        error: 'customer_not_found',
        message: 'No customer found linked to this authenticated user'
      }, { status: 404 })
    }

    // Build updates object with only provided fields
    const customerUpdates: any = {}
    const authUpdates: any = {}

    // Handle basic profile fields
    if (body.firstName !== undefined) {
      customerUpdates.first_name = body.firstName.trim()
      authUpdates.first_name = body.firstName.trim()
    }
    
    if (body.lastName !== undefined) {
      customerUpdates.last_name = body.lastName.trim()
      authUpdates.last_name = body.lastName.trim()
    }
    
    if (body.phone !== undefined) {
      customerUpdates.phone = body.phone.trim()
      authUpdates.phone = body.phone.trim()
    }

    // Handle arrays (allergies, dietary restrictions)
    if (body.allergies !== undefined) {
      customerUpdates.allergies = body.allergies
    }
    
    if (body.dietaryRestrictions !== undefined) {
      customerUpdates.dietary_restrictions = body.dietaryRestrictions
    }

    // Handle preferences
    if (body.preferences !== undefined) {
      // Merge with existing preferences
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('preferences')
        .eq('id', customer.id)
        .single()
      
      const existingPrefs = existingCustomer?.preferences || {}
      customerUpdates.preferences = { ...existingPrefs, ...body.preferences }
    }

    // Update customer table
    const { data: updatedCustomer, error: updateCustomerError } = await supabase
      .from('customers')
      .update(customerUpdates)
      .eq('id', customer.id)
      .select()
      .single()

    if (updateCustomerError) {
      console.error('Error updating customer:', updateCustomerError)
      return NextResponse.json({
        error: 'update_failed',
        message: 'Failed to update customer profile'
      }, { status: 500 })
    }

    // Update auth.users metadata if we have auth updates
    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        body.authUserId,
        {
          user_metadata: authUpdates
        }
      )

      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError)
        // Don't fail the request if auth update fails, just log it
      }
    }

    // Return the updated profile in the same format as the GET request
    const profile = {
      id: updatedCustomer.id,
      name: `${updatedCustomer.first_name || ''} ${updatedCustomer.last_name || ''}`.trim(),
      firstName: updatedCustomer.first_name,
      lastName: updatedCustomer.last_name,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      allergies: updatedCustomer.allergies || [],
      dietaryRestrictions: updatedCustomer.dietary_restrictions || [],
      preferences: updatedCustomer.preferences || {}
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({
      error: 'server_error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

function formatDateForSpeech(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `over a year ago`
}

function getSuggestedActions(profile: any, orderHistory: any[]): string[] {
  const suggestions = []
  
  if (orderHistory.length === 0) {
    suggestions.push("Browse our popular arrangements")
    suggestions.push("See what's new for this season")
  } else {
    const lastOrder = orderHistory[0]
    const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(lastOrder.date).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastOrder > 60) {
      suggestions.push("Check out our new seasonal arrangements")
    }
    
    suggestions.push("Reorder a previous favorite")
    
    if (orderHistory.length >= 3) {
      suggestions.push("View your order history")
    }
  }
  
  if (profile.allergies.length > 0) {
    suggestions.push("Find allergy-safe products")
  }
  
  return suggestions
} 