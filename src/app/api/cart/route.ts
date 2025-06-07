import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Cart API endpoints for chatbot integration
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    // Get cart data from cookie storage (simulating the zustand persist)
    const cookieStore = cookies()
    const cartData = cookieStore.get('edible-cart-storage')
    
    let cart = { items: [] }
    if (cartData) {
      try {
        const parsed = JSON.parse(cartData.value)
        cart = parsed.state || { items: [] }
      } catch (e) {
        console.error('Failed to parse cart data:', e)
      }
    }

    switch (action) {
      case 'get':
        return NextResponse.json({
          success: true,
          cart: {
            items: cart.items,
            itemCount: cart.items.reduce((count: number, item: any) => count + item.quantity, 0),
            total: cart.items.reduce((total: number, item: any) => {
              const price = item.option ? item.option.price : item.product.base_price
              return total + (price * item.quantity)
            }, 0)
          }
        })

      case 'summary':
        const subtotal = cart.items.reduce((total: number, item: any) => {
          const price = item.option ? item.option.price : item.product.base_price
          return total + (price * item.quantity)
        }, 0)
        const tax = subtotal * 0.0825
        const shipping = subtotal >= 65 ? 0 : 9.99
        const finalTotal = subtotal + tax + shipping

        return NextResponse.json({
          success: true,
          summary: {
            itemCount: cart.items.reduce((count: number, item: any) => count + item.quantity, 0),
            subtotal: subtotal,
            tax: tax,
            shipping: shipping,
            total: finalTotal,
            freeShippingEligible: subtotal >= 65,
            items: cart.items.map((item: any) => ({
              name: item.product.name,
              option: item.option?.option_name,
              quantity: item.quantity,
              price: item.option ? item.option.price : item.product.base_price,
              total: (item.option ? item.option.price : item.product.base_price) * item.quantity
            }))
          }
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use ?action=get or ?action=summary'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, optionId, quantity = 1 } = body

    if (!action) {
      return NextResponse.json({
        success: false,
        message: 'Action is required'
      }, { status: 400 })
    }

    // Note: This is a simplified implementation
    // In a real app, you'd want to validate products against your database
    // and handle the cart state management server-side or through client-side updates

    switch (action) {
      case 'add':
        if (!productId) {
          return NextResponse.json({
            success: false,
            message: 'Product ID is required for add action'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Added ${quantity} item(s) to cart`,
          action: 'add_to_cart',
          data: {
            productId,
            optionId,
            quantity,
            // Instructions for the frontend to execute
            clientAction: {
              type: 'ADD_TO_CART',
              payload: { productId, optionId, quantity }
            }
          }
        })

      case 'remove':
        if (!productId) {
          return NextResponse.json({
            success: false,
            message: 'Product ID is required for remove action'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Removed item from cart',
          action: 'remove_from_cart',
          data: {
            productId,
            optionId,
            clientAction: {
              type: 'REMOVE_FROM_CART',
              payload: { productId, optionId }
            }
          }
        })

      case 'update':
        if (!productId || quantity === undefined) {
          return NextResponse.json({
            success: false,
            message: 'Product ID and quantity are required for update action'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Updated quantity to ${quantity}`,
          action: 'update_quantity',
          data: {
            productId,
            optionId,
            quantity,
            clientAction: {
              type: 'UPDATE_QUANTITY',
              payload: { productId, optionId, quantity }
            }
          }
        })

      case 'clear':
        return NextResponse.json({
          success: true,
          message: 'Cart cleared',
          action: 'clear_cart',
          data: {
            clientAction: {
              type: 'CLEAR_CART',
              payload: {}
            }
          }
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Supported actions: add, remove, update, clear'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 