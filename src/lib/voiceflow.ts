import axios, { AxiosError } from 'axios';
import { chatbotActions, CartActionResponse } from './chatbotActions'
import { useCartStore } from '@/store/cartStore'

// Define the structure of a Voiceflow trace (add more specific types as needed)
export interface VoiceflowTrace {
  type: string;
  payload?: any;
  // Add other common trace properties if known, e.g., id, time
}

// Define the structure for the request action payload
export interface VoiceflowRequestAction {
  type: string;
  payload?: any;
}

// Configuration for the Voiceflow API client
interface VoiceflowConfig {
  apiKey: string;
  versionID: string; // e.g., 'production' or a specific version
  runtimeEndpoint: string;
  transcriptEndpoint: string;
  projectID: string;
}

// Transcript interfaces
export interface VoiceflowTranscript {
  _id: string;
  projectID: string;
  versionID: string;
  sessionID: string;
  unread: boolean;
  reportTags: string[];
  created: string;
  updatedAt: string;
  image?: string;
}

export interface VoiceflowDialog {
  _id: string;
  timestamp: string;
  type: string;
  payload: any;
}

// Fetch configuration from environment variables
const apiKey = process.env.NEXT_PUBLIC_VOICEFLOW_API_KEY;
const versionID = process.env.NEXT_PUBLIC_VOICEFLOW_VERSION_ID || 'production'; // Default to 'production'
const projectID = process.env.NEXT_PUBLIC_VOICEFLOW_PROJECT_ID;

if (!apiKey) {
  console.error(
    'Voiceflow API Key (NEXT_PUBLIC_VOICEFLOW_API_KEY) is not set in environment variables. Chatbot will not function.'
  );
}

if (!projectID) {
  console.error(
    'Voiceflow Project ID (NEXT_PUBLIC_VOICEFLOW_PROJECT_ID) is not set in environment variables. Transcript features will not function.'
  );
}

const defaultConfig: VoiceflowConfig = {
  apiKey: apiKey || '', // Will be empty if not set, handled by the error above
  versionID: versionID,
  runtimeEndpoint: 'https://general-runtime.voiceflow.com',
  transcriptEndpoint: 'https://api.voiceflow.com/v2',
  projectID: projectID || '',
};

/**
 * Generates a simple unique user ID.
 * For production, consider a more robust UUID generation method.
 */
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// Enhanced context interface for sending data to Voiceflow
interface ChatContext {
  isAuthenticated?: boolean
  userId?: string
  userName?: string
  userEmail?: string
  cartItemCount?: number
  cartTotal?: number
  userRole?: string
  lastOrderDate?: string
  preferredDeliveryZip?: string
}

// Enhanced interact function with context support
export const interact = async (
  userID: string, 
  request: any, 
  context?: ChatContext
): Promise<any[]> => {
  const apiKey = getVoiceflowApiKey()
  const versionID = getVoiceflowVersionId()
  
  if (!apiKey || !versionID) {
    console.error('Voiceflow configuration missing')
    return []
  }

  try {
    // Prepare the request payload with context
    const requestPayload: any = { request }
    
    // Add context as variables if provided
    if (context) {
      requestPayload.state = {
        variables: {
          // Authentication context
          isAuthenticated: context.isAuthenticated || false,
          userId: context.userId || null,
          userName: context.userName || null,
          userEmail: context.userEmail || null,
          userRole: context.userRole || 'guest',
          
          // Shopping context
          cartItemCount: context.cartItemCount || 0,
          cartTotal: context.cartTotal || 0,
          
          // User preferences
          lastOrderDate: context.lastOrderDate || null,
          preferredDeliveryZip: context.preferredDeliveryZip || null,
          
          // Session metadata
          sessionTimestamp: new Date().toISOString(),
          source: 'website'
        }
      }
    }

    console.log('Sending to Voiceflow:', {
      userID,
      request: requestPayload.request,
      variables: requestPayload.state?.variables
    })

    const response = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${encodeURIComponent(userID)}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'versionID': versionID,
        },
        body: JSON.stringify(requestPayload),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const traces = await response.json()
    console.log('Voiceflow response traces:', traces)
    return traces || []
  } catch (error) {
    console.error('Error interacting with Voiceflow:', error)
    return []
  }
}

// New function to update user authentication status
export const updateAuthenticationStatus = async (
  userID: string,
  isAuthenticated: boolean,
  userDetails?: {
    id?: string
    name?: string
    email?: string
    role?: string
  }
): Promise<void> => {
  try {
    const context: ChatContext = {
      isAuthenticated,
      userId: userDetails?.id,
      userName: userDetails?.name,
      userEmail: userDetails?.email,
      userRole: userDetails?.role || (isAuthenticated ? 'authenticated' : 'guest')
    }

    // Send a system message to update the context
    await interact(userID, {
      type: 'intent',
      payload: {
        intent: {
          name: 'update_auth_status'
        },
        entities: []
      }
    }, context)

    console.log(`Updated auth status for ${userID}:`, context)
  } catch (error) {
    console.error('Error updating authentication status:', error)
  }
}

// New function to send cart updates
export const updateCartContext = async (
  userID: string,
  cartData: any
): Promise<void> => {
  try {
    const itemCount = cartData?.items?.length || 0
    const total = cartData?.getTotal?.() || 0

    const context: ChatContext = {
      cartItemCount: itemCount,
      cartTotal: total
    }

    // Send cart update to Voiceflow
    await interact(userID, {
      type: 'intent',
      payload: {
        intent: {
          name: 'update_cart_context'
        },
        entities: []
      }
    }, context)

    console.log(`Updated cart context for ${userID}:`, context)
  } catch (error) {
    console.error('Error updating cart context:', error)
  }
}

// Enhanced sendMessage function with automatic context
export const sendMessageWithContext = async (
  userID: string,
  message: string,
  additionalContext?: ChatContext
): Promise<any[]> => {
  // Get current authentication state (you'll need to adapt this to your auth system)
  const authContext = getCurrentAuthContext()
  
  // Get current cart state
  const cartContext = getCurrentCartContext()
  
  // Merge all context
  const fullContext: ChatContext = {
    ...authContext,
    ...cartContext,
    ...additionalContext
  }

  return await interact(userID, {
    type: 'text',
    payload: message
  }, fullContext)
}

// Helper functions to get current context (adapt these to your systems)
function getCurrentAuthContext(): ChatContext {
  // You'll implement this based on your auth system
  // For example, if using NextAuth or similar:
  try {
    // Get from your auth store/context/session
    const isAuthenticated = checkIfUserIsAuthenticated() // Your auth check
    const user = getCurrentUser() // Your user getter
    
    return {
      isAuthenticated,
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      userRole: user?.role || 'authenticated'
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      userRole: 'guest'
    }
  }
}

function getCurrentCartContext(): ChatContext {
  try {
    // Get from your cart store
    const cartData = useCartStore.getState() || {}
    const itemCount = cartData?.items?.length || 0
    const total = cartData?.getTotal?.() || 0
    
    return {
      cartItemCount: itemCount,
      cartTotal: total
    }
  } catch (error) {
    return {
      cartItemCount: 0,
      cartTotal: 0
    }
  }
}

// Placeholder functions - you'll replace these with your actual implementations
function checkIfUserIsAuthenticated(): boolean {
  // Replace with your auth check
  // Example: return !!session?.user
  return false
}

function getCurrentUser(): any {
  // Replace with your user getter
  // Example: return session?.user
  return null
}

// Initial launch action to start or reset a conversation
export const launchRequest: VoiceflowRequestAction = {
  type: 'launch',
};

// Function to create a text request action
export const createTextRequest = (text: string): VoiceflowRequestAction => {
  return {
    type: 'text',
    payload: text,
  };
};

/**
 * Saves a conversation transcript to Voiceflow
 * @param userId The unique ID for the user/conversation session
 * @param configOptional Optional configuration overrides
 * @returns Promise that resolves when transcript is saved
 */
export const saveTranscript = async (
  userId: string,
  configOptional?: Partial<VoiceflowConfig>
): Promise<void> => {
  const config = { ...defaultConfig, ...configOptional };

  if (!config.apiKey || !config.projectID) {
    console.warn('Cannot save transcript: API Key or Project ID missing');
    return;
  }

  const url = `${config.transcriptEndpoint}/transcripts`;

  try {
    await axios.put(
      url,
      {
        projectID: config.projectID,
        versionID: config.versionID,
        sessionID: userId,
      },
      {
        headers: {
          Authorization: config.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error saving transcript:', error);
  }
};

/**
 * Fetches conversation transcripts from Voiceflow
 * @param configOptional Optional configuration overrides
 * @returns Promise that resolves to array of transcripts
 */
export const fetchTranscripts = async (
  configOptional?: Partial<VoiceflowConfig>
): Promise<VoiceflowTranscript[]> => {
  const config = { ...defaultConfig, ...configOptional };

  if (!config.apiKey || !config.projectID) {
    console.warn('Cannot fetch transcripts: API Key or Project ID missing');
    return [];
  }

  const url = `${config.transcriptEndpoint}/transcripts/${config.projectID}`;

  try {
    const response = await axios.get<VoiceflowTranscript[]>(url, {
      headers: {
        Authorization: config.apiKey,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return [];
  }
};

/**
 * Fetches dialog for a specific transcript
 * @param transcriptId The transcript ID to fetch dialog for
 * @param configOptional Optional configuration overrides
 * @returns Promise that resolves to array of dialog entries
 */
export const fetchTranscriptDialog = async (
  transcriptId: string,
  configOptional?: Partial<VoiceflowConfig>
): Promise<VoiceflowDialog[]> => {
  const config = { ...defaultConfig, ...configOptional };

  if (!config.apiKey) {
    console.warn('Cannot fetch transcript dialog: API Key missing');
    return [];
  }

  const url = `${config.transcriptEndpoint}/transcripts/${transcriptId}`;

  try {
    const response = await axios.get<VoiceflowDialog[]>(url, {
      headers: {
        Authorization: config.apiKey,
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transcript dialog:', error);
    return [];
  }
};

// Add cart and checkout actions to handle chatbot commands
export const handleChatbotAction = async (action: string, params: any = {}): Promise<CartActionResponse> => {
  console.log('Executing chatbot action:', action, params)
  
  switch (action) {
    // Cart actions
    case 'get_cart':
      return await chatbotActions.getCartSummary()
    
    case 'add_to_cart':
      const { productId, optionId, quantity } = params
      if (!productId) {
        return { success: false, message: 'Product ID is required' }
      }
      return await chatbotActions.addProductToCart(productId, optionId, quantity)
    
    case 'remove_from_cart':
      if (!params.productId) {
        return { success: false, message: 'Product ID is required' }
      }
      return await chatbotActions.removeFromCart(params.productId, params.optionId)
    
    case 'update_cart_quantity':
      if (!params.productId || params.quantity === undefined) {
        return { success: false, message: 'Product ID and quantity are required' }
      }
      return await chatbotActions.updateCartQuantity(params.productId, params.quantity, params.optionId)
    
    case 'clear_cart':
      return await chatbotActions.clearCart()
    
    case 'validate_cart':
      return await chatbotActions.validateCart()
    
    // Checkout actions
    case 'checkout_status':
      return await chatbotActions.getCheckoutStatus()
    
    case 'proceed_to_checkout':
      return await chatbotActions.initiateCheckout()
    
    // Product actions
    case 'get_product_details':
      if (!params.productId) {
        return { success: false, message: 'Product ID is required' }
      }
      return await chatbotActions.getProductDetails(params.productId)
    
    // Navigation actions
    case 'navigate_to_cart':
      if (typeof window !== 'undefined') {
        window.location.href = '/cart'
      }
      return { success: true, message: 'Navigating to cart...' }
    
    case 'navigate_to_checkout':
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout'
      }
      return { success: true, message: 'Navigating to checkout...' }
    
    case 'navigate_to_products':
      if (typeof window !== 'undefined') {
        window.location.href = '/products'
      }
      return { success: true, message: 'Navigating to products...' }
    
    default:
      return { 
        success: false, 
        message: `Unknown action: ${action}. Available actions: get_cart, add_to_cart, remove_from_cart, update_cart_quantity, clear_cart, validate_cart, checkout_status, proceed_to_checkout, get_product_details, navigate_to_cart, navigate_to_checkout, navigate_to_products` 
      }
  }
}

// Enhanced interact function that can handle action requests
export const interactWithActions = async (userID: string, request: any): Promise<any> => {
  // First, send the request to Voiceflow
  const response = await interact(userID, request)
  
  // Check if any traces contain action instructions
  if (response && Array.isArray(response)) {
    for (const trace of response) {
      // Check for custom action traces
      if (trace.type === 'custom' && trace.payload?.action) {
        const actionResult = await handleChatbotAction(trace.payload.action, trace.payload.params || {})
        
        // You could modify the response here to include action results
        if (actionResult.success) {
          // Add a success message to the conversation
          response.push({
            type: 'text',
            payload: { message: actionResult.message }
          })
        } else {
          // Add an error message
          response.push({
            type: 'text',
            payload: { message: `Action failed: ${actionResult.message}` }
          })
        }
      }
      
      // Check for action buttons that trigger cart/checkout functions
      if (trace.type === 'choice' && trace.payload?.buttons) {
        trace.payload.buttons = trace.payload.buttons.map((button: any) => {
          // If button has action data, we'll handle it when clicked
          if (button.request?.payload?.action) {
            button._hasAction = true
            button._actionType = button.request.payload.action
            button._actionParams = button.request.payload.params || {}
          }
          return button
        })
      }
    }
  }
  
  return response
}

// Example of how to use it (primarily for testing or direct use later)
/*
async function testVoiceflow() {
  if (!defaultConfig.apiKey) return; // Don't run if API key isn't set

  const userId = generateUserId();
  console.log('Starting conversation with User ID:', userId);

  let traces = await interact(userId, launchRequest);
  traces.forEach(trace => console.log(JSON.stringify(trace)));

  if (traces.some(t => t.type === 'error')) return;

  // Example: sending a text message
  // traces = await interact(userId, createTextRequest("Hello assistant"));
  // traces.forEach(trace => console.log(JSON.stringify(trace)));

  // Save transcript
  // await saveTranscript(userId);
}

// testVoiceflow(); // Uncomment to test, ensure API key is set
*/

// Helper functions to get Voiceflow configuration
function getVoiceflowApiKey(): string {
  return process.env.NEXT_PUBLIC_VOICEFLOW_API_KEY || ''
}

function getVoiceflowVersionId(): string {
  return process.env.NEXT_PUBLIC_VOICEFLOW_VERSION_ID || 'production'
}

// New function to get full user profile when authenticated
export const getUserProfile = async (
  userID: string,
  identifiers: {
    userId?: string
    email?: string
    phone?: string
    authUserId?: string
  }
): Promise<any> => {
  try {
    // Try Supabase Edge Function first (more comprehensive)
    const supabaseResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/user-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'get_profile',
          ...identifiers
        })
      }
    )

    if (supabaseResponse.ok) {
      const data = await supabaseResponse.json()
      console.log('Retrieved user profile from Supabase:', data)
      return data
    }

    // Fallback to Next.js API
    const nextResponse = await fetch('/api/user/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(identifiers)
    })

    if (nextResponse.ok) {
      const data = await nextResponse.json()
      console.log('Retrieved user profile from Next.js API:', data)
      return data
    }

    return { 
      error: 'profile_not_found', 
      authenticated: false,
      message: 'Could not retrieve user profile'
    }

  } catch (error) {
    console.error('Error getting user profile:', error)
    return { 
      error: 'profile_error', 
      authenticated: false,
      message: 'Failed to retrieve user profile'
    }
  }
}

// Enhanced function to send message with full profile context
export const sendMessageWithFullContext = async (
  userID: string,
  message: string,
  authDetails?: {
    userId?: string
    email?: string
    phone?: string
    authUserId?: string
  }
): Promise<any[]> => {
  let profileContext: any = {}

  // If user is authenticated, get their full profile
  if (authDetails && Object.values(authDetails).some(val => val)) {
    const profileData = await getUserProfile(userID, authDetails)
    
    if (profileData.success && profileData.profile) {
      profileContext = {
        // Authentication info
        isAuthenticated: true,
        userId: profileData.profile.id,
        userName: profileData.profile.name,
        userEmail: profileData.profile.email,
        userPhone: profileData.profile.phone,
        userRole: profileData.profile.role,
        userTier: profileData.profile.tier,

        // Order history
        totalOrders: profileData.profile.stats?.totalOrders || 0,
        totalSpent: profileData.profile.stats?.totalSpent || '0.00',
        lastOrderDate: profileData.profile.stats?.lastOrderDate,
        isReturningCustomer: (profileData.profile.stats?.totalOrders || 0) > 0,

        // Safety info
        allergies: profileData.profile.allergies || [],
        dietaryRestrictions: profileData.profile.dietaryRestrictions || [],

        // Personalization
        favoriteCategories: profileData.preferences?.favoriteCategories || [],
        orderFrequency: profileData.preferences?.orderFrequency || 'new',

        // Recent orders for reference
        recentOrderNumbers: profileData.recentOrders?.slice(0, 3).map((order: any) => order.orderNumber) || [],
        
        // Convenience data
        hasAddresses: (profileData.addresses?.length || 0) > 0,
        hasRecipientAddresses: (profileData.recipientAddresses?.length || 0) > 0
      }
    } else {
      // User identifier provided but no profile found
      profileContext = {
        isAuthenticated: false,
        userRole: 'guest',
        needsAccountCreation: true
      }
    }
  } else {
    // No auth details provided - guest user
    profileContext = {
      isAuthenticated: false,
      userRole: 'guest'
    }
  }

  // Get current cart context
  const cartContext = getCurrentCartContext()

  // Merge all context
  const fullContext = {
    ...profileContext,
    ...cartContext
  }

  console.log('Sending message with full context:', fullContext)

  return await interact(userID, {
    type: 'text',
    payload: message
  }, fullContext)
}

// Function to get order history for chatbot
export const getUserOrderHistory = async (
  userID: string,
  identifiers: {
    userId?: string
    email?: string
    phone?: string
    authUserId?: string
  },
  limit: number = 5
): Promise<any> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/user-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'get_order_history',
          limit,
          ...identifiers
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data
    }

    return { error: 'order_history_not_found' }

  } catch (error) {
    console.error('Error getting order history:', error)
    return { error: 'order_history_error' }
  }
}

// Function to get personalized recommendations
export const getPersonalizedRecommendations = async (
  userID: string,
  identifiers: {
    userId?: string
    email?: string
    phone?: string
    authUserId?: string
  }
): Promise<any> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/user-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'get_recommendations',
          ...identifiers
        })
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data
    }

    return { error: 'recommendations_not_found' }

  } catch (error) {
    console.error('Error getting recommendations:', error)
    return { error: 'recommendations_error' }
  }
} 