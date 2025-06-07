import { useCartStore } from '@/store/cartStore'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ChatbotAction {
  type: string
  payload: any
}

export interface CartActionResponse {
  success: boolean
  message: string
  action?: string
  data?: any
}

export class ChatbotActionHandler {
  private static instance: ChatbotActionHandler
  
  static getInstance(): ChatbotActionHandler {
    if (!ChatbotActionHandler.instance) {
      ChatbotActionHandler.instance = new ChatbotActionHandler()
    }
    return ChatbotActionHandler.instance
  }

  // Execute client actions returned from APIs
  async executeClientAction(action: ChatbotAction): Promise<void> {
    const { type, payload } = action

    switch (type) {
      case 'ADD_TO_CART':
        const { addItem } = useCartStore.getState()
        addItem(payload.product, payload.option, payload.quantity)
        break

      case 'REMOVE_FROM_CART':
        const { removeItem } = useCartStore.getState()
        removeItem(payload.productId, payload.optionId)
        break

      case 'UPDATE_QUANTITY':
        const { updateQuantity } = useCartStore.getState()
        updateQuantity(payload.productId, payload.quantity, payload.optionId)
        break

      case 'CLEAR_CART':
        const { clearCart } = useCartStore.getState()
        clearCart()
        break

      case 'NAVIGATE':
        if (typeof window !== 'undefined') {
          window.location.href = payload.url
        }
        break

      case 'SHOW_PRODUCT_DETAILS':
        if (typeof window !== 'undefined') {
          window.location.href = `/products/${payload.product.product_identifier}`
        }
        break

      case 'SHOW_ORDER_CONFIRMATION':
        if (typeof window !== 'undefined') {
          alert(payload.message) // In production, use a proper modal/toast
        }
        break

      default:
        console.warn('Unknown client action type:', type)
    }
  }

  // Cart API methods
  async getCart(): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart?action=get')
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cart information'
      }
    }
  }

  async getCartSummary(): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart?action=summary')
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cart summary'
      }
    }
  }

  async addToCart(productId: string, optionId?: string, quantity: number = 1): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          productId,
          optionId,
          quantity
        })
      })
      
      const result = await response.json()
      
      // Execute client action if provided
      if (result.success && result.data?.clientAction) {
        await this.executeClientAction(result.data.clientAction)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add item to cart'
      }
    }
  }

  async removeFromCart(productId: string, optionId?: string): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove',
          productId,
          optionId
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.clientAction) {
        await this.executeClientAction(result.data.clientAction)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Failed to remove item from cart'
      }
    }
  }

  async updateCartQuantity(productId: string, quantity: number, optionId?: string): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          productId,
          optionId,
          quantity
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.clientAction) {
        await this.executeClientAction(result.data.clientAction)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update cart quantity'
      }
    }
  }

  async clearCart(): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear'
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data?.clientAction) {
        await this.executeClientAction(result.data.clientAction)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear cart'
      }
    }
  }

  // Checkout API methods
  async getCheckoutStatus(): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/checkout?action=status')
      return await response.json()
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get checkout status'
      }
    }
  }

  async initiateCheckout(): Promise<CartActionResponse> {
    try {
      const response = await fetch('/api/checkout?action=initiate')
      const result = await response.json()
      
      if (result.success && result.data?.clientAction) {
        await this.executeClientAction(result.data.clientAction)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate checkout'
      }
    }
  }

  // Supabase Edge Function methods
  async validateCart(): Promise<CartActionResponse> {
    try {
      const { items } = useCartStore.getState()
      
      const { data, error } = await supabase.functions.invoke('cart-manager', {
        body: {
          action: 'validate',
          cartData: { items }
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate cart'
      }
    }
  }

  async getProductDetails(productId: string): Promise<CartActionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('cart-manager', {
        body: {
          action: 'get',
          productId
        }
      })

      if (error) throw error
      
      if (data.success && data.data?.clientAction) {
        await this.executeClientAction(data.data.clientAction)
      }
      
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get product details'
      }
    }
  }

  async addProductToCart(productId: string, optionId?: string, quantity: number = 1): Promise<CartActionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('cart-manager', {
        body: {
          action: 'add',
          productId,
          optionId,
          quantity
        }
      })

      if (error) throw error
      
      if (data.success && data.data?.clientAction) {
        await this.executeClientAction(data.data.clientAction)
      }
      
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add product to cart'
      }
    }
  }

  async getAdvancedCartSummary(): Promise<CartActionResponse> {
    try {
      const { items } = useCartStore.getState()
      
      const { data, error } = await supabase.functions.invoke('cart-manager', {
        body: {
          action: 'summary',
          cartData: { items }
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get cart summary'
      }
    }
  }
}

// Export singleton instance
export const chatbotActions = ChatbotActionHandler.getInstance() 