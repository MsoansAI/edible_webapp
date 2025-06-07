export interface Product {
  id: string
  product_identifier: number
  name: string
  description?: string
  base_price: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  price: number
  description?: string
  image_url?: string
  is_available: boolean
}

export interface Category {
  id: string
  name: string
  type: 'occasion' | 'season' | 'dietary'
  created_at: string
}

export interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  allergies: string[]
  dietary_restrictions: string[]
  preferences: any
  created_at: string
  last_order_at?: string
  auth_user_id?: string
}

export interface Order {
  id: string
  customer_id: string
  franchisee_id: string
  recipient_address_id?: string
  order_number: string
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  fulfillment_type: 'delivery' | 'pickup'
  subtotal: number
  tax_amount: number
  total_amount: number
  scheduled_date?: string
  scheduled_time_slot?: string
  pickup_customer_name?: string
  special_instructions?: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_option_id?: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface CartItem {
  product: Product
  option?: ProductOption
  quantity: number
}

export interface CartState {
  items: CartItem[]
  addItem: (product: Product, option?: ProductOption, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number, optionId?: string) => void
  removeItem: (productId: string, optionId?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export interface RecipientAddress {
  id?: string
  customer_id?: string
  recipient_name: string
  recipient_phone?: string
  street_address: string
  city: string
  state: string
  zip_code: string
  country?: string
  delivery_instructions?: string
}

export interface Franchisee {
  id: string
  store_number: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  is_active: boolean
  operating_hours: any
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    phone?: string
  }
} 