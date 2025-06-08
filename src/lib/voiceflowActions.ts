import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export interface VoiceflowTrace {
  type: string;
  payload: any;
  processed?: boolean;
}

export interface VoiceflowCustomAction {
  type: string
  payload: any
}

export interface CartSyncItem {
  productId: string
  productIdentifier: number
  productName: string
  option?: {
    id: string
    name: string
    price: number
  } | null
  quantity: number
  unitPrice: number
  totalPrice: number
  imageUrl?: string
}

export interface VoiceflowCartData {
  items: any[]
  summary: {
    itemCount: number
    subtotal: number
    tax: number
    shipping: number
    total: number
    freeShippingEligible: boolean
  }
  itemDetails: CartSyncItem[]
}

/**
 * Synchronizes cart between Voiceflow and frontend
 * Compares Voiceflow cartData with current frontend cart and adds missing items
 */
export const syncCartFromVoiceflow = async (voiceflowCartData: VoiceflowCartData): Promise<void> => {
  try {
    const { items: currentItems, addItem } = useCartStore.getState()
    const voiceflowItems = voiceflowCartData.itemDetails || []

    console.log('Syncing cart from Voiceflow:', voiceflowItems)
    console.log('Current frontend cart:', currentItems)

    // Find items that exist in Voiceflow but not in frontend cart
    const itemsToAdd: CartSyncItem[] = []

    for (const vfItem of voiceflowItems) {
      // Check if this item exists in current cart
      const existsInCart = currentItems.some(cartItem => 
        cartItem.product.id === vfItem.productId && 
        (cartItem.option?.id === vfItem.option?.id || (!cartItem.option && !vfItem.option))
      )

      if (!existsInCart) {
        itemsToAdd.push(vfItem)
      } else {
        // Check if quantities are different
        const cartItem = currentItems.find(cartItem => 
          cartItem.product.id === vfItem.productId && 
          (cartItem.option?.id === vfItem.option?.id || (!cartItem.option && !vfItem.option))
        )
        
        if (cartItem && cartItem.quantity < vfItem.quantity) {
          // Need to add the difference
          const quantityDiff = vfItem.quantity - cartItem.quantity
          itemsToAdd.push({ ...vfItem, quantity: quantityDiff })
        }
      }
    }

    // Add missing items to cart
    for (const item of itemsToAdd) {
      // Convert Voiceflow item to frontend product format
      const product = {
        id: item.productId,
        product_identifier: item.productIdentifier,
        name: item.productName,
        base_price: item.option ? 0 : item.unitPrice, // Use 0 if option price is used
        image_url: item.imageUrl || '',
        description: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const option = item.option ? {
        id: item.option.id,
        product_id: item.productId,
        option_name: item.option.name,
        price: item.option.price,
        description: '',
        image_url: '',
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : undefined

      addItem(product, option, item.quantity)
      
      toast.success(`Added ${item.quantity} ${item.productName}${item.option ? ` (${item.option.name})` : ''} to cart`)
    }

    if (itemsToAdd.length > 0) {
      console.log(`Added ${itemsToAdd.length} items to cart from Voiceflow`)
    } else {
      console.log('Cart already in sync with Voiceflow')
    }

  } catch (error) {
    console.error('Error syncing cart from Voiceflow:', error)
    toast.error('Failed to sync cart')
  }
}

/**
 * Handles custom actions sent from Voiceflow
 */
export const handleVoiceflowAction = async (action: VoiceflowCustomAction): Promise<void> => {
  console.log('Handling Voiceflow action:', action)

  switch (action.type) {
    case 'add-to-cart':
      if (action.payload.cartData) {
        await syncCartFromVoiceflow(action.payload.cartData)
      } else if (action.payload.product) {
        // Handle single product addition
        const { addItem } = useCartStore.getState()
        addItem(
          action.payload.product, 
          action.payload.option, 
          action.payload.quantity || 1
        )
        toast.success(`Added ${action.payload.product.name} to cart`)
      }
      break

    case 'update-cart':
      if (action.payload.cartData) {
        await syncCartFromVoiceflow(action.payload.cartData)
      }
      break

    case 'checkout-page':
      // Navigate to checkout page
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout'
      }
      break

    case 'view-cart':
      // Navigate to cart page
      if (typeof window !== 'undefined') {
        window.location.href = '/cart'
      }
      break

    case 'clear-cart':
      const { clearCart } = useCartStore.getState()
      clearCart()
      toast.success('Cart cleared')
      // Dispatch a custom event to notify the UI to re-render
      window.dispatchEvent(new CustomEvent('cart-updated'));
      break

    case 'remove-item':
      if (action.payload.productId) {
        const { removeItem } = useCartStore.getState()
        removeItem(action.payload.productId, action.payload.optionId)
        toast.success('Item removed from cart')
        // Dispatch a custom event to notify the UI to re-render
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
      break

    case 'navigate':
      // Generic navigation action
      if (action.payload.url && typeof window !== 'undefined') {
        window.location.href = action.payload.url
      }
      break

    case 'show-notification':
      // Show toast notification
      if (action.payload.message) {
        const type = action.payload.type || 'info'
        switch (type) {
          case 'success':
            toast.success(action.payload.message)
            break
          case 'error':
            toast.error(action.payload.message)
            break
          case 'warning':
            toast.error(action.payload.message) // Using error for warning as react-hot-toast doesn't have warning
            break
          default:
            toast(action.payload.message)
        }
      }
      break

    default:
      console.warn('Unhandled Voiceflow action type:', action.type)
  }
}

/**
 * Processes an array of Voiceflow traces to handle custom actions.
 * It identifies custom action traces and calls the appropriate handler.
 */
export const processVoiceflowTraces = async (traces: VoiceflowTrace[]): Promise<VoiceflowTrace[]> => {
  for (const trace of traces) {
    let actionToHandle: VoiceflowCustomAction | null = null;

    // This handles the structure we've seen: { type: "clear-cart", payload: { type: "custom", ... } }
    // It checks if the trace type itself is a recognized action.
    if (isKnownActionType(trace.type)) {
      actionToHandle = { type: trace.type, payload: trace.payload || {} };
      console.log(`Processing direct action trace: ${trace.type}`);
    }
    // This handles the standard structure: { type: "custom", payload: { action: { ... } } }
    else if (trace.type === 'custom' && trace.payload?.action) {
      actionToHandle = trace.payload.action;
      console.log(`Processing custom action payload: ${actionToHandle!.type}`);
    }

    if (actionToHandle) {
      await handleVoiceflowAction(actionToHandle);
      // Mark trace as processed so it's not handled again by other parts of the UI
      (trace as any).processed = true;
    }
  }
  return traces;
};

/**
 * A helper function to check if a given trace type string
 * matches one of our known custom action names.
 */
function isKnownActionType(type: string): boolean {
  const knownActions = [
    'add-to-cart', 
    'update-cart', 
    'remove-item', 
    'clear-cart', 
    'checkout-page', 
    'navigate', 
    'show-notification'
  ];
  return knownActions.includes(type);
}

/**
 * Helper function to get current cart data in Voiceflow format
 */
export const getCurrentCartForVoiceflow = (): VoiceflowCartData => {
  try {
    const { items, getTotal, getItemCount } = useCartStore.getState()
    const subtotal = getTotal()
    
    return {
      items: items,
      summary: {
        itemCount: getItemCount(),
        subtotal: subtotal,
        tax: subtotal * 0.0825,
        shipping: subtotal >= 65 ? 0 : 9.99,
        total: subtotal + (subtotal * 0.0825) + (subtotal >= 65 ? 0 : 9.99),
        freeShippingEligible: subtotal >= 65
      },
      itemDetails: items.map(item => ({
        productId: item.product.id,
        productIdentifier: item.product.product_identifier,
        productName: item.product.name,
        option: item.option ? {
          id: item.option.id,
          name: item.option.option_name,
          price: item.option.price
        } : null,
        quantity: item.quantity,
        unitPrice: item.option ? item.option.price : item.product.base_price,
        totalPrice: (item.option ? item.option.price : item.product.base_price) * item.quantity,
        imageUrl: item.product.image_url
      }))
    }
  } catch (error) {
    console.error('Error getting cart data for Voiceflow:', error)
    return {
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        freeShippingEligible: false
      },
      itemDetails: []
    }
  }
} 