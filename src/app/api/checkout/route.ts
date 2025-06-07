import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Checkout API endpoints for chatbot integration
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    // Get cart data
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

    const itemCount = cart.items.reduce((count: number, item: any) => count + item.quantity, 0)

    switch (action) {
      case 'status':
        if (itemCount === 0) {
          return NextResponse.json({
            success: true,
            canCheckout: false,
            message: 'Your cart is empty. Add some items before checkout.',
            redirectUrl: '/products'
          })
        }

        const subtotal = cart.items.reduce((total: number, item: any) => {
          const price = item.option ? item.option.price : item.product.base_price
          return total + (price * item.quantity)
        }, 0)
        const tax = subtotal * 0.0825
        const shipping = subtotal >= 65 ? 0 : 9.99
        const total = subtotal + tax + shipping

        return NextResponse.json({
          success: true,
          canCheckout: true,
          summary: {
            itemCount,
            subtotal,
            tax,
            shipping,
            total,
            freeShippingEligible: subtotal >= 65
          },
          checkoutUrl: '/checkout'
        })

      case 'initiate':
        if (itemCount === 0) {
          return NextResponse.json({
            success: false,
            message: 'Cannot proceed to checkout with an empty cart',
            action: 'redirect_to_products',
            data: {
              clientAction: {
                type: 'NAVIGATE',
                payload: { url: '/products' }
              }
            }
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Redirecting to checkout...',
          action: 'proceed_to_checkout',
          data: {
            clientAction: {
              type: 'NAVIGATE',
              payload: { url: '/checkout' }
            }
          }
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use ?action=status or ?action=initiate'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, orderData } = body

    switch (action) {
      case 'prepare':
        // Validate cart has items
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

        if (cart.items.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'Cannot checkout with empty cart'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Ready for checkout',
          data: {
            requiresInfo: ['contact', 'delivery', 'payment'],
            estimatedTotal: cart.items.reduce((total: number, item: any) => {
              const price = item.option ? item.option.price : item.product.base_price
              return total + (price * item.quantity)
            }, 0)
          }
        })

      case 'process':
        // This would integrate with your payment processor
        // For now, simulate the checkout process
        return NextResponse.json({
          success: true,
          message: 'Order processing initiated',
          action: 'process_order',
          data: {
            orderId: `EDI-${Date.now()}`,
            status: 'processing',
            clientAction: {
              type: 'SHOW_ORDER_CONFIRMATION',
              payload: { 
                message: 'Your order is being processed. You will receive a confirmation email shortly.',
                orderId: `EDI-${Date.now()}`
              }
            }
          }
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Supported actions: prepare, process'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 