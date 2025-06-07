import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartState, CartItem, Product, ProductOption } from '@/types/database'

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product: Product, option?: ProductOption, quantity: number = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex((item) => 
            item.product.id === product.id && 
            (item.option?.id === option?.id || (!item.option && !option))
          )
          
          if (existingItemIndex !== -1) {
            const updatedItems = [...state.items]
            updatedItems[existingItemIndex].quantity += quantity
            return { items: updatedItems }
          } else {
            return { items: [...state.items, { product, option, quantity }] }
          }
        })
      },
      
      updateQuantity: (productId: string, quantity: number, optionId?: string) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => 
                !(item.product.id === productId && 
                  (item.option?.id === optionId || (!item.option && !optionId)))
              )
            }
          }
          
          return {
            items: state.items.map((item) => 
              item.product.id === productId && 
              (item.option?.id === optionId || (!item.option && !optionId))
                ? { ...item, quantity }
                : item
            )
          }
        })
      },
      
      removeItem: (productId: string, optionId?: string) => {
        set((state) => ({
          items: state.items.filter((item) => 
            !(item.product.id === productId && 
              (item.option?.id === optionId || (!item.option && !optionId)))
          )
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get()
        return items.reduce((total, item) => {
          const price = item.option ? item.option.price : item.product.base_price
          return total + (price * item.quantity)
        }, 0)
      },
      
      getItemCount: () => {
        const { items } = get()
        return items.reduce((count, item) => count + item.quantity, 0)
      }
    }),
    {
      name: 'edible-cart-storage',
    }
  )
) 