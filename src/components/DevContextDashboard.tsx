'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { supabase } from '@/lib/supabase'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  XMarkIcon,
  UserIcon,
  ShoppingCartIcon,
  ClockIcon,
  StarIcon,
  BugAntIcon
} from '@heroicons/react/24/outline'

interface ContextData {
  // Auth context
  isAuthenticated: boolean
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string
  
  // Profile context
  lastOrderDate: string | null
  preferredDeliveryZip: string | null
  totalOrders: number
  userTier: string
  
  // Cart context
  cartItemCount: number
  cartTotal: number
  cartData: any
  
  // Meta
  lastUpdated: string
  loadTime: number
}

export default function DevContextDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [contextData, setContextData] = useState<ContextData | null>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development'

  const cartStore = useCartStore()

  console.log('DevContextDashboard rendering:', { isDev, isVisible })

  const handleToggleClick = () => {
    console.log('Dashboard toggle clicked!')
    setIsVisible(true)
  }

  const loadContextData = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      // Get auth context (using our fixed function logic)
      const { data: { session } } = await supabase.auth.getSession()
      
      let authContext = {
        isAuthenticated: false,
        userId: null as string | null,
        userName: null as string | null,
        userEmail: null as string | null,
        userRole: 'guest' as string,
        lastOrderDate: null as string | null,
        preferredDeliveryZip: null as string | null,
        totalOrders: 0,
        userTier: 'new' as string
      }

      if (session) {
        authContext.isAuthenticated = true
        authContext.userId = session.user.id
        authContext.userEmail = session.user.email || null
        authContext.userRole = 'authenticated'
        
        // Try to get profile data
        try {
          const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authUserId: session.user.id })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.profile) {
              const profile = data.profile
              authContext.userName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
              authContext.lastOrderDate = profile.stats?.lastOrderDate || null
              authContext.preferredDeliveryZip = profile.preferences?.preferredDeliveryZip || null
              authContext.totalOrders = profile.stats?.totalOrders || 0
              authContext.userTier = profile.tier || 'new'
            }
          }
        } catch (profileError) {
          console.warn('Profile loading failed:', profileError)
          authContext.userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        }
      }

      // Get cart context (using existing logic)
      const items = cartStore?.items || []
      const total = cartStore?.getTotal?.() || 0
      const itemCount = cartStore?.getItemCount?.() || 0

      console.log('Dashboard cart data:', { 
        uniqueProducts: items.length, 
        totalQuantity: itemCount, 
        total: total 
      })

      const cartContext = {
        cartItemCount: itemCount, // Use total quantity, not unique products
        cartTotal: total,
        cartData: {
          items,
          summary: {
            itemCount: itemCount, // Use total quantity here too
            subtotal: total,
            tax: total * 0.0825,
            shipping: total >= 65 ? 0 : 9.99,
            total: total + (total * 0.0825) + (total >= 65 ? 0 : 9.99),
            freeShippingEligible: total >= 65
          }
        }
      }

      const loadTime = Date.now() - startTime

      setContextData({
        ...authContext,
        ...cartContext,
        lastUpdated: new Date().toLocaleTimeString(),
        loadTime
      })
    } catch (error) {
      console.error('Error loading context:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible && isDev) {
      loadContextData()
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(loadContextData, 5000)
      return () => clearInterval(interval)
    }
  }, [isVisible, isDev])

  // Listen to cart changes for immediate updates
  useEffect(() => {
    if (isVisible && isDev) {
      // Subscribe to cart store changes
      const unsubscribe = useCartStore.subscribe((state) => {
        console.log('Cart changed, updating dashboard. Item count:', state.items.length)
        loadContextData()
      })
      
      return unsubscribe
    }
  }, [isVisible, isDev])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!isDev) {
    console.log('Not in dev mode, hiding dashboard')
    return null
  }

  return (
    <div className="fixed z-[9999]">
      {/* Toggle Button */}
      {!isVisible && (
        <button
          onClick={handleToggleClick}
          className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Show Context Dashboard"
        >
          {BugAntIcon ? <BugAntIcon className="h-5 w-5" /> : <span>🐛</span>}
        </button>
      )}

      {/* Dashboard Panel */}
      {isVisible && (
        <div
          className="bg-white border border-gray-300 rounded-lg shadow-xl max-w-sm"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Header */}
          <div
            className="bg-blue-600 text-white px-3 py-2 rounded-t-lg flex items-center justify-between cursor-grab"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <BugAntIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Context Dashboard</span>
              {loading && <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200 p-1"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white hover:text-gray-200 p-1"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && contextData && (
            <div className="p-3 space-y-3 text-xs max-h-96 overflow-y-auto">
              {/* Auth Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700 font-medium">
                  <UserIcon className="h-4 w-4" />
                  <span>Authentication</span>
                </div>
                <div className="bg-gray-50 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">isAuthenticated:</span>
                    <span className={`font-medium ${contextData.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                      {String(contextData.isAuthenticated)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">userRole:</span>
                    <span className="font-medium">{contextData.userRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">userName:</span>
                    <span className="font-medium">{contextData.userName || 'null'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">userEmail:</span>
                    <span className="font-medium text-xs">{contextData.userEmail || 'null'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">userId:</span>
                    <span className="font-medium text-xs">{contextData.userId ? `...${contextData.userId.slice(-8)}` : 'null'}</span>
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700 font-medium">
                  <StarIcon className="h-4 w-4" />
                  <span>Profile Data</span>
                </div>
                <div className="bg-gray-50 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">userTier:</span>
                    <span className="font-medium">{contextData.userTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">totalOrders:</span>
                    <span className="font-medium">{contextData.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">lastOrderDate:</span>
                    <span className="font-medium text-xs">{contextData.lastOrderDate || 'null'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">deliveryZip:</span>
                    <span className="font-medium">{contextData.preferredDeliveryZip || 'null'}</span>
                  </div>
                </div>
              </div>

              {/* Cart Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-700 font-medium">
                  <ShoppingCartIcon className="h-4 w-4" />
                  <span>Cart Data</span>
                </div>
                <div className="bg-gray-50 p-2 rounded space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">cartItemCount:</span>
                    <span className="font-medium">{contextData.cartItemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">cartTotal:</span>
                    <span className="font-medium">${contextData.cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">freeShipping:</span>
                    <span className={`font-medium ${contextData.cartData?.summary?.freeShippingEligible ? 'text-green-600' : 'text-red-600'}`}>
                      {String(contextData.cartData?.summary?.freeShippingEligible || false)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2 border-t">
                <button
                  onClick={loadContextData}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => console.log('Full Context Data:', contextData)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-xs transition-colors"
                >
                  Log to Console
                </button>
              </div>

              {/* Meta Info */}
              <div className="pt-2 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{contextData.lastUpdated}</span>
                </div>
                <div className="flex justify-between">
                  <span>Load Time:</span>
                  <span>{contextData.loadTime}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Minimized View */}
          {isMinimized && contextData && (
            <div className="p-2 text-xs">
              <div className="flex items-center space-x-3">
                <span className={`w-2 h-2 rounded-full ${contextData.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-medium">{contextData.userName || 'Guest'}</span>
                <span className="text-gray-500">Cart: {contextData.cartItemCount}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 