# 🛒 **Voiceflow Cart Architecture - Custom Actions & Full Cart Data**

## 🎯 **Overview**

This architecture eliminates duplicate API endpoints by leveraging Voiceflow's custom action system and full cart data synchronization. The cart state flows seamlessly between the frontend and Voiceflow without needing separate API routes.

## 🏗️ **Architecture Flow**

```
Frontend Cart ←→ Voiceflow Variables ←→ Supabase Edge Functions
     ↓                    ↓                        ↓
Cart Store         Full cartData            cart-manager
  (Zustand)         Variable              (Validation/Products)
     ↓                    ↓                        
Custom Actions    Custom Actions         
  Handler          (Voiceflow)           
```

**Key Components:**
- **Frontend Cart Store**: Zustand-based cart management
- **Custom Actions Handler**: `src/lib/voiceflowActions.ts` processes Voiceflow custom actions
- **Voiceflow Variables**: Full cart state passed with every interaction
- **Supabase Edge Functions**: Backend validation and processing (`cart-manager`)

## 📊 **Data Flow**

### **1. Frontend → Voiceflow**
```javascript
// Every message includes full cart context
const context = {
  cartItemCount: 3,
  cartTotal: 89.97,
  cartData: {
    items: [...],
    summary: { itemCount, subtotal, tax, shipping, total, freeShippingEligible },
    itemDetails: [
      {
        productId: "prod-123",
        productIdentifier: 3075,
        productName: "Chocolate Bouquet",
        option: { id: "opt-456", name: "Large", price: 49.99 },
        quantity: 2,
        unitPrice: 49.99,
        totalPrice: 99.98
      }
    ]
  }
}
```

### **2. Voiceflow → Backend Validation**
```javascript
// Voiceflow validates cart using cart-manager
POST /functions/v1/cart-manager
{
  "action": "validate",
  "cartData": cartData
}
```

### **3. Voiceflow → Frontend Actions**
```javascript
// Custom actions sent back to frontend
{
  "type": "custom",
  "payload": {
    "action": {
      "type": "add-to-cart",
      "payload": {
        "cartData": updatedCartData
      }
    }
  }
}
```

## 🔧 **Implementation Components**

### **1. Enhanced Voiceflow Integration (`src/lib/voiceflow.ts`)**

**Full Cart Data Sync:**
```typescript
const context: ChatContext = {
  // Individual variables (backward compatibility)
  cartItemCount: itemCount,
  cartTotal: total,
  
  // Complete cart object
  cartData: {
    items: cartData.items,
    summary: {
      itemCount, subtotal, tax, shipping, total, freeShippingEligible
    },
    itemDetails: cartData.items.map(item => ({
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
      totalPrice: (item.option ? item.option.price : item.product.base_price) * item.quantity
    }))
  }
}
```

### **2. Custom Action Handler (`src/lib/voiceflowActions.ts`)**

**Action Types:**
- `add-to-cart` - Sync cart from Voiceflow to frontend
- `update-cart` - Update cart with new data
- `checkout-page` - Navigate to checkout
- `view-cart` - Navigate to cart page
- `clear-cart` - Clear all items
- `remove-item` - Remove specific item
- `navigate` - Generic navigation
- `show-notification` - Display toast messages

**Cart Synchronization:**
```typescript
export const syncCartFromVoiceflow = async (voiceflowCartData: VoiceflowCartData) => {
  const { items: currentItems, addItem } = useCartStore.getState()
  const voiceflowItems = voiceflowCartData.itemDetails || []

  // Find items that exist in Voiceflow but not in frontend cart
  const itemsToAdd = voiceflowItems.filter(vfItem => 
    !currentItems.some(cartItem => 
      cartItem.product.id === vfItem.productId && 
      cartItem.option?.id === vfItem.option?.id
    )
  )

  // Add missing items to frontend cart
  for (const item of itemsToAdd) {
    addItem(convertToProduct(item), convertToOption(item), item.quantity)
  }
}
```

### **3. ChatPanel Integration (`src/components/ChatPanel.tsx`)**

**Process Custom Actions:**
```typescript
const processTraces = async (traces: VoiceflowTrace[]) => {
  // Process custom actions first
  const processedTraces = await processVoiceflowTraces(traces)
  
  // Then handle regular traces (text, carousel, etc.)
  processedTraces.forEach(trace => {
    if (trace.processed) return // Skip custom actions
    // Handle regular traces...
  })
}
```

## 🎭 **Voiceflow Configuration**

### **1. Variables to Create**
```
cartData (Object) - Full cart object
cartItemCount (Number) - Item count for quick access
cartTotal (Number) - Total value for quick access
isAuthenticated (Boolean) - User auth status
userId (Text) - User identifier
```

### **2. Using Cart Data in Voiceflow**

**Text/Speak Blocks:**
```
You have {cartData.summary.itemCount} items in your cart.
Your subtotal is ${cartData.summary.subtotal}.
{if cartData.summary.freeShippingEligible}
  Great! You qualify for free shipping!
{else}
  Add ${65 - cartData.summary.subtotal} more to get free shipping!
{/if}
```

**API Calls to Backend:**
```json
{
  "action": "validate",
  "cartData": "{cartData}"
}
```

**Custom Actions:**
```json
{
  "type": "custom",
  "payload": {
    "action": {
      "type": "add-to-cart",
      "payload": {
        "cartData": "{cartData}"
      }
    }
  }
}
```

### **3. Backend Integration (cart-manager)**

**Validate Cart:**
```javascript
// In Voiceflow API block
const response = await fetch('{{SUPABASE_URL}}/functions/v1/cart-manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  },
  body: JSON.stringify({
    action: 'validate',
    cartData: cartData
  })
})
```

**Add Product to Cart (via Voiceflow):**
```javascript
// In Voiceflow custom code block
const newItem = {
  productId: productId,
  productIdentifier: productIdentifier,
  productName: productName,
  option: selectedOption,
  quantity: 1,
  unitPrice: selectedOption ? selectedOption.price : basePrice,
  totalPrice: selectedOption ? selectedOption.price : basePrice
}

// Add to cartData
cartData.itemDetails.push(newItem)
cartData.summary.itemCount += 1
cartData.summary.subtotal += newItem.totalPrice
// Recalculate tax, shipping, total...

// Send custom action to frontend
return {
  type: 'custom',
  payload: {
    action: {
      type: 'add-to-cart',
      payload: { cartData: cartData }
    }
  }
}
```

## 🔄 **Workflow Examples**

### **1. Adding Product to Cart**

1. **User**: "Add the large chocolate bouquet to my cart"
2. **Voiceflow**: 
   - Validates product using cart-manager
   - Updates cartData variable
   - Sends custom action: `add-to-cart`
3. **Frontend**: 
   - Receives custom action
   - Syncs cart from Voiceflow cartData
   - Shows success notification

### **2. Checkout Flow**

1. **User**: "I want to checkout"
2. **Voiceflow**: 
   - Validates cart using cart-manager
   - Checks authentication status
   - Sends custom action: `checkout-page`
3. **Frontend**: 
   - Navigates to /checkout
   - Cart is already synchronized

### **3. Cart Summary**

1. **User**: "What's in my cart?"
2. **Voiceflow**: 
   - Reads from cartData variable
   - Lists items with details
   - Shows totals and shipping info

## ✅ **Benefits**

1. **🎯 Single Source of Truth**: Cart state managed in one place
2. **🔄 Real-time Sync**: Frontend and Voiceflow always in sync
3. **🛡️ Backend Validation**: All cart operations validated via cart-manager
4. **⚡ No Duplicate APIs**: Eliminates redundant endpoints
5. **🎭 Rich Context**: Voiceflow has complete cart information
6. **🔧 Flexible Actions**: Custom actions for any frontend operation

## 🧪 **Testing**

### **Test Cart Sync**
```bash
# 1. Add items via website UI
# 2. Ask chatbot "what's in my cart?"
# 3. Add items via chatbot
# 4. Check website cart - should be synced
```

### **Test Custom Actions**
```bash
# 1. Ask chatbot to "add chocolate bouquet"
# 2. Should see item appear in frontend cart
# 3. Ask chatbot "take me to checkout"
# 4. Should navigate to checkout page
```

## 🗑️ **Removed Legacy Components**

The following files have been removed as part of the custom actions migration:

### **Frontend API Endpoints (Removed)**
- ~~`src/app/api/cart/route.ts`~~ - Cart operations now handled via custom actions
- ~~`src/app/api/checkout/route.ts`~~ - Checkout flow now handled via custom actions

### **Legacy Libraries (Removed)**
- ~~`src/lib/chatbotActions.ts`~~ - Replaced by `src/lib/voiceflowActions.ts`

### **Why These Were Removed:**
1. **Eliminated Duplication**: Frontend APIs duplicated cart-manager functionality
2. **Simplified Architecture**: Direct Voiceflow ↔ Supabase integration
3. **Better Performance**: Reduced API call chains
4. **Cleaner Codebase**: Single responsibility pattern

### **Migration Path:**
- **Cart Operations**: Use `cart-manager` edge function directly from Voiceflow
- **Frontend Updates**: Use custom actions (add-to-cart, remove-item, checkout-page)
- **Navigation**: Use custom actions (navigate) instead of API redirects

## 🚀 **Deployment Notes**

1. **Environment Variables**: Update Voiceflow project with production URLs
2. **Backend Endpoints**: Ensure cart-manager is deployed
3. **Variable Sync**: Test full cart data flow in production
4. **Error Handling**: Verify fallbacks for failed sync operations
5. **Legacy Cleanup**: Ensure no references to removed API endpoints

This architecture provides a robust, scalable solution for cart management between your website and Voiceflow chatbot! 🎉 