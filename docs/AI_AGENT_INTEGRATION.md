# AI Agent Integration Guide

Complete guide for integrating AI agents with the Edible Arrangements backend, specifically optimized for Voiceflow chatbots.

## Overview

This system provides Voiceflow-optimized APIs for conversational commerce, featuring voice-friendly responses, natural language processing, and intelligent conversation flows.

### Key Features
- **Voice-Optimized APIs**: Responses designed for text-to-speech output
- **Conversational Error Handling**: User-friendly error messages with helpful suggestions
- **Context Preservation**: Stateless operations that maintain conversation flow
- **Smart Cancellation Prevention**: Automatic live agent handoff for complex scenarios

## Integration Architecture

### Voiceflow → Edge Functions → Supabase
```
[Customer Voice/Text] 
    ↓
[Voiceflow Agent] 
    ↓ HTTP POST/GET
[Edge Functions] 
    ↓ SQL/JSONB
[Supabase Database]
```

### Response Format Strategy
All APIs return structured responses optimized for conversational interfaces:
- **Conversational summaries** for voice output
- **Structured data** for decision logic
- **Error messages** with helpful guidance
- **Context information** for flow control

## Customer Interaction Flow

### 1. Customer Identification
**Endpoint**: `POST /functions/v1/customer-management`

#### Voiceflow Implementation
```json
{
  "phone": "{{phone_number}}",
  "firstName": "{{first_name}}",
  "lastName": "{{last_name}}",
  "email": "{{email_address}}",
  "allergies": ["{{allergen_1}}", "{{allergen_2}}"],
  "source": "chatbot"
}
```

#### Response Handling
```javascript
// In Voiceflow API step
const response = await fetch('{{SUPABASE_URL}}/functions/v1/customer-management', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  },
  body: JSON.stringify({
    phone: phone_number,
    firstName: first_name,
    source: "chatbot"
  })
});

const data = await response.json();

// Set Voiceflow variables
customer_id = data.customer._internalId;
customer_name = data.customer.firstName;
is_new_customer = data.customer.isNewAccount;
order_count = data.orderHistory.length;

// Use summary for voice response
return data.summary;
```

### 2. Product Discovery
**Endpoint**: `POST /functions/v1/product-search`

#### Natural Language Search
```json
{
  "query": "{{customer_request}}",
  "priceRange": "{{price_preference}}",
  "allergens": ["{{customer_allergies}}"],
  "franchiseeId": "{{selected_store_id}}",
  "limit": 3
}
```

#### Voiceflow Integration Pattern
```javascript
// Extract search intent from customer input
const searchQuery = customer_message; // "chocolate strawberries for birthday"
const priceRange = extracted_price_range; // "mid" or "budget" or "premium"

const response = await fetch('{{SUPABASE_URL}}/functions/v1/product-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  },
  body: JSON.stringify({
    query: searchQuery,
    priceRange: priceRange,
    allergens: customer_allergies,
    franchiseeId: store_id
  })
});

const data = await response.json();

// Create voice-friendly product presentation
if (data.products.length > 0) {
  const product = data.products[0];
  product_name = product.name;
  product_price = product.basePrice;
  product_id = product.productId;
  internal_product_id = product._internalId;
  
  return `I found ${data.products.length} great options. The most popular is ${product.name} for ${product.basePrice}. ${product.description}`;
} else {
  return data.searchSummary || "I couldn't find products matching your request. Could you try describing what you're looking for differently?";
}
```

### 3. Store Location
**Endpoint**: `GET /functions/v1/franchisee-inventory/find-nearest`

#### Simple Store Lookup
```javascript
const response = await fetch(`{{SUPABASE_URL}}/functions/v1/franchisee-inventory/find-nearest?zipCode=${customer_zip}`, {
  headers: {
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  }
});

const data = await response.json();

store_id = data.store._internalId;
store_name = data.store.name;
store_phone = data.store.phone;
delivery_available = data.store.services.delivery.available;
delivery_fee = data.store.services.delivery.fee;

return data.summary; // "Found your local store with same-day delivery available"
```

### 4. Order Creation
**Endpoint**: `POST /functions/v1/order`

#### Complete Order Structure
```json
{
  "customerId": "{{customer_internal_id}}",
  "franchiseeId": "{{store_internal_id}}",
  "fulfillmentType": "delivery",
  "items": [
    {
      "productId": "{{product_4_digit_id}}",
      "optionName": "{{selected_option}}",
      "quantity": 1,
      "addons": [
        {"addonName": "Greeting Card", "quantity": 1}
      ]
    }
  ],
  "deliveryAddress": {
    "recipientName": "{{recipient_name}}",
    "recipientPhone": "{{recipient_phone}}",
    "streetAddress": "{{street_address}}",
    "city": "{{city}}",
    "state": "{{state}}",
    "zipCode": "{{zip_code}}",
    "deliveryInstructions": "{{special_instructions}}"
  },
  "scheduledDate": "{{delivery_date}}",
  "scheduledTimeSlot": "{{time_slot}}",
  "specialInstructions": "{{gift_message}}"
}
```

#### Voiceflow Order Flow
```javascript
const orderData = {
  customerId: customer_internal_id,
  franchiseeId: store_internal_id,
  fulfillmentType: fulfillment_type, // "delivery" or "pickup"
  items: [{
    productId: selected_product_id, // 4-digit ID like "3075"
    optionName: selected_option, // "Large", "Small", etc.
    quantity: parseInt(item_quantity),
    addons: selected_addons // Array of addon objects
  }],
  deliveryAddress: {
    recipientName: recipient_name,
    recipientPhone: recipient_phone,
    streetAddress: delivery_address,
    city: delivery_city,
    state: delivery_state,
    zipCode: delivery_zip,
    deliveryInstructions: delivery_instructions
  },
  scheduledDate: delivery_date,
  scheduledTimeSlot: delivery_time,
  specialInstructions: gift_message
};

const response = await fetch('{{SUPABASE_URL}}/functions/v1/order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  },
  body: JSON.stringify(orderData)
});

const data = await response.json();

order_number = data.order.orderNumber;
total_amount = data.order.pricing.totalAmount;

return data.summary; // "Order W25710000001-1 created successfully for $75.75"
```

### 5. Order Modification
**Endpoint**: `PATCH /functions/v1/order-items`

#### Adding/Removing Items
```javascript
const modifications = {
  orderNumber: current_order_number,
  items: [{
    action: "add", // or "remove" or "update"
    productId: product_id,
    optionName: option_name,
    quantity: item_quantity
  }]
};

const response = await fetch('{{SUPABASE_URL}}/functions/v1/order-items', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {{SUPABASE_ANON_KEY}}'
  },
  body: JSON.stringify(modifications)
});

const data = await response.json();

// Handle cancellation prevention
if (data.action === "cancellation_request") {
  // Redirect to live agent
  return data.message; // "I understand you want to remove all items. Let me connect you with a live agent..."
}

// Normal modification response
new_total = data.order.pricing.totalAmount;
return data.summary; // "Order updated successfully. New total: $211.06"
```

## Conversation Design Patterns

### Voice-Optimized Product Presentation
```
AI: "I found 3 perfect options for you. The most popular is our Chocolate Dipped Strawberries for $49.99. These are fresh strawberries covered in premium chocolate - perfect for birthdays. Would you like to hear about the other options or shall we go with this one?"

Customer: "Tell me about the other options"

AI: "The second option is our Berry Beautiful Bouquet for $54.99 - that's fresh strawberries with grapes and pineapple. The third is our Premium Chocolate Collection for $79.99 with strawberries, chocolate cookies, and truffles. Which sounds best to you?"
```

### Error Handling with Guidance
```javascript
// When product search returns no results
if (searchResponse.products.length === 0) {
  return `I couldn't find exactly what you're looking for. ${searchResponse.suggestions.join(' or ')}. What would you like to try?`;
}

// When customer provides invalid option
if (response.error === "validation_failed") {
  return `${response.message} The available options are: ${response.availableOptions.join(', ')}. Which would you prefer?`;
}
```

### Context Preservation
```javascript
// Maintain conversation context across API calls
conversation_state = {
  customer_id: customer_internal_id,
  store_id: store_internal_id,
  current_order: order_number,
  selected_products: product_array,
  delivery_info: address_object
};

// Use context for follow-up questions
if (conversation_state.current_order) {
  return `Great! I have your order ${conversation_state.current_order} for ${total_amount}. Would you like to add anything else or shall we proceed to payment?`;
}
```

## Advanced Features

### Allergy Safety Integration
```javascript
// Automatically check allergies during product search
const searchRequest = {
  query: customer_request,
  allergens: customer_allergies, // Passed from customer profile
  franchiseeId: store_id
};

// AI warns about potential allergens
if (productResponse.products[0].ingredients.some(ingredient => 
    customer_allergies.includes(ingredient))) {
  return `I found ${product.name}, but I notice it contains ${conflicting_allergen} which is in your allergy list. Let me find something safer for you.`;
}
```

### Smart Upselling
```javascript
// Suggest addons based on order context
if (order_total < 50 && occasion === "birthday") {
  return `Your order is $${order_total}. For just $4.99 more, I can add a birthday greeting card, or for $7.99 we can include a balloon bundle. Would either of those be nice?`;
}
```

### Delivery Logic
```javascript
// Check delivery availability and timing
if (selected_date === "today" && current_time > store_cutoff) {
  return `Today's delivery cutoff has passed, but I can schedule this for tomorrow ${store_hours.tomorrow} or you can pick it up today until ${store_hours.today}. What works better for you?`;
}
```

## Error Recovery Patterns

### Connection Issues
```javascript
try {
  const response = await fetch(apiEndpoint, requestOptions);
  const data = await response.json();
  return handleSuccessResponse(data);
} catch (error) {
  return "I'm having trouble connecting to our system right now. Let me try a different approach, or I can connect you with a live agent who can help immediately.";
}
```

### Invalid Input Recovery
```javascript
// Guide customer to valid inputs
if (response.error === "validation_failed") {
  return `${response.message} ${response.suggestion || "Could you try again with the correct format?"}`;
}
```

### Graceful Degradation
```javascript
// When advanced features fail, fall back to basic functionality
if (semanticSearchFailed) {
  return "Let me try a simpler search. Could you tell me the specific product name or number you're looking for?";
}
```

## Frontend Integration - Custom Actions

### Custom Actions Architecture
The frontend now uses a custom actions system instead of API endpoints. Voiceflow sends custom action traces that are processed by `src/lib/voiceflowActions.ts`.

#### Supported Custom Actions

**Cart Management:**
```json
{
  "type": "custom",
  "payload": {
    "action": {
      "type": "add-to-cart",
      "payload": {
        "cartData": {
          "items": [...],
          "summary": {...}
        }
      }
    }
  }
}
```

**Item Removal:**
```json
{
  "type": "custom",
  "payload": {
    "action": {
      "type": "remove-item",
      "payload": {
        "productIdentifier": "3075",
        "optionName": "Large"
      }
    }
  }
}
```

**Navigation:**
```json
{
  "type": "custom",
  "payload": {
    "action": {
      "type": "checkout-page",
      "payload": {}
    }
  }
}
```

#### Full Cart Context
Every Voiceflow interaction now includes complete cart state:

```javascript
// Automatically passed to Voiceflow with each message
const context = {
  cartData: {
    items: [...], // Full cart items with UUIDs
    summary: {
      itemCount: 3,
      subtotal: 89.97,
      tax: 7.42,
      shipping: 0,
      total: 97.39,
      freeShippingEligible: true
    }
  },
  cartItemCount: 3,
  cartTotal: 97.39,
  isAuthenticated: true,
  userId: "user-uuid"
}
```

### Migration from Legacy APIs

**Before (Removed):**
- `POST /api/cart` - Cart operations
- `GET /api/checkout` - Checkout status
- `src/lib/chatbotActions.ts` - Legacy action handler

**After (Current):**
- Custom Actions: Direct Voiceflow → Frontend communication
- Backend Validation: Voiceflow → cart-manager → Frontend sync
- State Management: Full cart context in every interaction

## Performance Optimization

### Response Caching
```javascript
// Cache frequently accessed data
if (cached_store_info && cached_store_info.zipCode === customer_zip) {
  store_data = cached_store_info;
} else {
  store_data = await fetchStoreInfo(customer_zip);
  cached_store_info = store_data;
}
```

### Parallel Requests
```javascript
// Fetch customer and store info simultaneously
const [customerResponse, storeResponse] = await Promise.all([
  fetch(customerEndpoint, customerRequest),
  fetch(storeEndpoint, storeRequest)
]);
```

### Custom Actions Benefits
1. **Eliminated API Duplication**: Direct Voiceflow-backend integration
2. **Real-time Sync**: Cart state always synchronized
3. **Better Performance**: Reduced API call chains
4. **Simplified Architecture**: Single responsibility patterns

This integration guide provides everything needed to build sophisticated Voiceflow chatbots that leverage the complete Edible Arrangements backend while maintaining natural, conversational interactions. 