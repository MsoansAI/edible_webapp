import { useEffect, useRef } from 'react'
import { updateAuthenticationStatus, updateCartContext } from '@/lib/voiceflow'
import { useCartStore } from '@/store/cartStore'

interface User {
  id: string
  name?: string
  email?: string
  role?: string
}

interface UseVoiceflowAuthProps {
  isAuthenticated: boolean
  user?: User | null
  userID: string // Voiceflow session ID
}

export const useVoiceflowAuth = ({ isAuthenticated, user, userID }: UseVoiceflowAuthProps) => {
  const previousAuthState = useRef<boolean | null>(null)
  const cartStore = useCartStore()
  const previousCartState = useRef<string>('')

  // Sync authentication status when it changes
  useEffect(() => {
    // Only update if auth state actually changed
    if (previousAuthState.current !== isAuthenticated) {
      console.log(`🔄 Auth state changed: ${previousAuthState.current} → ${isAuthenticated}`)
      
      updateAuthenticationStatus(userID, isAuthenticated, user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      } : undefined)
      
      previousAuthState.current = isAuthenticated
    }
  }, [isAuthenticated, user, userID])

  // Sync cart changes
  useEffect(() => {
    const currentCartString = JSON.stringify({
      items: cartStore.items,
      total: cartStore.getTotal()
    })
    
    // Only update if cart actually changed
    if (previousCartState.current !== currentCartString) {
      console.log('🛒 Cart state changed, updating Voiceflow context')
      
      updateCartContext(userID, cartStore)
      previousCartState.current = currentCartString
    }
  }, [cartStore.items, userID])

  return {
    // Helper function to manually trigger auth sync
    syncAuthState: () => updateAuthenticationStatus(userID, isAuthenticated, user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    } : undefined),
    
    // Helper function to manually trigger cart sync
    syncCartState: () => updateCartContext(userID, cartStore)
  }
}

export default useVoiceflowAuth 