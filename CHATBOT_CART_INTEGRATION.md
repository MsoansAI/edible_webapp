# 🛒 Chatbot Cart & Checkout Integration Guide

## Overview

Your Edible Arrangements chatbot can now fully interact with your website's cart and checkout functionality through:

1. **Next.js API Routes** (`/api/cart`, `/api/checkout`)
2. **Supabase Edge Function** (`cart-manager`)
3. **Client-side Action Handler** (`chatbotActions.ts`)
4. **Voiceflow Integration** (enhanced `voiceflow.ts`)

---

## 🔧 **API Endpoints Available**

### Cart API (`/api/cart`)

#### GET Requests:
```bash
# Get basic cart info
GET /api/cart?action=get

# Get detailed cart summary with totals
GET /api/cart?action=summary
```

#### POST Requests:
```bash
# Add item to cart
POST /api/cart
{
  "action": "add",
  "productId": "prod-123",
  "optionId": "opt-456", // optional
  "quantity": 2
}

# Update quantity
POST /api/cart
{
  "action": "update",
  "productId": "prod-123",
  "optionId": "opt-456", // optional
  "quantity": 3
}

# Remove item
POST /api/cart
{
  "action": "remove",
  "productId": "prod-123",
  "optionId": "opt-456" // optional
}

# Clear entire cart
POST /api/cart
{
  "action": "clear"
}
```

### Checkout API (`/api/checkout`)

#### GET Requests:
```bash
# Check if cart is ready for checkout
GET /api/checkout?action=status

# Initiate checkout (redirects user)
GET /api/checkout?action=initiate
```

---

## 🚀 **Supabase Edge Function**

### Deploy the Cart Manager Function:

```bash
# Deploy to Supabase
supabase functions deploy cart-manager
```

### Available Actions:
- `validate` - Validates cart items against database
- `get` - Gets product details with options
- `add` - Adds validated product to cart
- `summary` - Provides detailed cart summary

---

## 💬 **Voiceflow Integration**

### 1. **Set Up Custom Actions in Voiceflow**

In your Voiceflow workspace, create **Custom Actions** that your chatbot can trigger:

#### Example Flow 1: Add to Cart
```
User: "Add the chocolate strawberries to my cart"
Bot: [Triggers custom action]
Action Type: "add_to_cart"
Parameters: {
  "productId": "extracted_product_id",
  "quantity": 1
}
```

#### Example Flow 2: View Cart
```
User: "What's in my cart?"
Bot: [Triggers custom action]
Action Type: "get_cart"
```

#### Example Flow 3: Checkout
```
User: "I want to checkout"
Bot: [Triggers custom action]
Action Type: "proceed_to_checkout"
```

### 2. **Configure Voiceflow Actions**

In Voiceflow, use the **API Step** or **Custom Action** to send data like:

```json
{
  "type": "custom",
  "payload": {
    "action": "add_to_cart",
    "params": {
      "productId": "{product_id}",
      "quantity": "{quantity}"
    }
  }
}
```

### 3. **Available Actions for Voiceflow**

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `get_cart` | Show cart contents | None |
| `add_to_cart` | Add product to cart | `productId`, `quantity?`, `optionId?` |
| `remove_from_cart` | Remove item from cart | `productId`, `optionId?` |
| `update_cart_quantity` | Update item quantity | `productId`, `quantity`, `optionId?` |
| `clear_cart` | Empty the cart | None |
| `validate_cart` | Check cart validity | None |
| `checkout_status` | Check if ready to checkout | None |
| `proceed_to_checkout` | Navigate to checkout | None |
| `get_product_details` | Show product info | `productId` |
| `navigate_to_cart` | Go to cart page | None |
| `navigate_to_checkout` | Go to checkout page | None |
| `navigate_to_products` | Go to products page | None |

---

## 🎯 **Usage Examples**

### Example 1: Basic Cart Interaction

**User**: "What's in my cart?"

**Voiceflow Response**: Uses `get_cart` action
```json
{
  "success": true,
  "summary": {
    "itemCount": 2,
    "subtotal": 45.99,
    "tax": 3.78,
    "shipping": 0,
    "total": 49.77,
    "freeShippingEligible": true,
    "items": [
      {
        "name": "Chocolate Covered Strawberries",
        "quantity": 1,
        "price": 29.99,
        "total": 29.99
      },
      {
        "name": "Fruit Bouquet",
        "option": "Large",
        "quantity": 1,
        "price": 16.00,
        "total": 16.00
      }
    ]
  }
}
```

**Bot**: "You have 2 items in your cart totaling $49.77. Your order qualifies for free shipping! Would you like to proceed to checkout?"

### Example 2: Adding Products

**User**: "Add 2 chocolate strawberry boxes to my cart"

**Voiceflow**: Extracts product info and uses `add_to_cart`
```json
{
  "action": "add_to_cart",
  "params": {
    "productId": "prod-choc-strawberry-123",
    "quantity": 2
  }
}
```

**Result**: Product automatically added to cart, user sees confirmation

### Example 3: Checkout Flow

**User**: "I want to checkout"

**Step 1**: `checkout_status` action checks cart
**Step 2**: If valid, `proceed_to_checkout` navigates user
**Step 3**: User lands on `/checkout` page

---

## 🛠 **Implementation Steps**

### 1. **Update Your Voiceflow Project**

Add these custom actions to your Voiceflow flows:

```javascript
// In Voiceflow API steps or custom actions
{
  "type": "custom",
  "payload": {
    "action": "{{action_name}}",
    "params": {
      "productId": "{{product_id}}",
      "quantity": "{{quantity}}"
    }
  }
}
```

### 2. **Update ChatPanel.tsx**

Import and use the enhanced interaction:

```typescript
import { interactWithActions, handleChatbotAction } from '@/lib/voiceflow'

// In your message handler
const handleUserMessage = async (message: string) => {
  try {
    const response = await interactWithActions(userID, {
      type: 'text',
      payload: message
    })
    
    // Process response with action handling
    // ...
  } catch (error) {
    console.error('Chat error:', error)
  }
}
```

### 3. **Test Your Integration**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test API endpoints**:
   ```bash
   # Test cart API
   curl -X GET "http://localhost:3000/api/cart?action=summary"
   
   # Test adding to cart
   curl -X POST "http://localhost:3000/api/cart" \
     -H "Content-Type: application/json" \
     -d '{"action":"add","productId":"test-123","quantity":1}'
   ```

3. **Test in chatbot**:
   - "What's in my cart?"
   - "Add strawberries to cart"
   - "Take me to checkout"

---

## 🔒 **Security Considerations**

1. **Validate all product IDs** against your database
2. **Check product availability** before adding to cart
3. **Sanitize user inputs** from Voiceflow
4. **Rate limit API calls** to prevent abuse
5. **Use HTTPS** in production

---

## 📱 **Mobile & Responsive**

All cart interactions work seamlessly across:
- ✅ Desktop chatbot
- ✅ Mobile chat interface  
- ✅ Cart page updates in real-time
- ✅ Checkout process integration

---

## 🚀 **Next Steps**

1. **Deploy Supabase function**: `supabase functions deploy cart-manager`
2. **Update Voiceflow flows** with custom actions
3. **Test end-to-end** cart interactions
4. **Add analytics** to track chatbot commerce conversions
5. **Implement order tracking** for completed purchases

---

## 💡 **Pro Tips**

1. **Use product search** before adding to cart:
   ```javascript
   // Search for product first, then add
   const searchResult = await searchProducts(userQuery)
   await handleChatbotAction('add_to_cart', { 
     productId: searchResult.id 
   })
   ```

2. **Handle errors gracefully**:
   ```javascript
   if (!actionResult.success) {
     // Show user-friendly error
     return "Sorry, I couldn't add that to your cart. Please try again."
   }
   ```

3. **Provide cart totals** in responses:
   ```javascript
   const cartSummary = await handleChatbotAction('get_cart')
   return `Added to cart! Your total is now $${cartSummary.total}`
   ```

---

Your chatbot can now handle the complete shopping experience from product discovery to checkout! 🛍️✨ 