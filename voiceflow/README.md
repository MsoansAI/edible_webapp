# Voiceflow Integration Examples

This folder contains practical examples and templates for integrating the Edible Arrangements backend with Voiceflow chatbots.

## Quick Setup Guide

### 1. Environment Variables in Voiceflow
Set these variables in your Voiceflow project settings:

```javascript
SUPABASE_URL = "https://jfjvqylmjzprnztbfhpa.supabase.co"
SUPABASE_ANON_KEY = "your_anon_key_here"
```

### 2. Common API Integration Patterns

#### Customer Identification (API Step)
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-management`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
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

return data.summary; // "Welcome back John! You have 2 previous orders."
```

#### Product Search (API Step)
```javascript
const searchResponse = await fetch(`${SUPABASE_URL}/functions/v1/product-search`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    query: customer_request,
    priceRange: extracted_price_range,
    allergens: customer_allergies
  })
});

const data = await searchResponse.json();

if (data.products.length > 0) {
  product_name = data.products[0].name;
  product_price = data.products[0].basePrice;
  product_id = data.products[0].productId;
  
  return `I found ${data.products.length} great options. The most popular is ${product_name} for ${product_price}.`;
} else {
  return "I couldn't find products matching your request. Could you describe what you're looking for differently?";
}
```

### 3. Flow Structure Recommendations

```
1. Welcome → Capture Phone Number
2. Customer Lookup → Welcome Message
3. Product Search → Present Options
4. Store Finder → Delivery Options
5. Order Creation → Confirmation
6. Order Modification → Live Agent Handoff (if needed)
```

## Files in This Folder

- `customer-flow.json` - Complete customer identification flow
- `product-search-flow.json` - Product discovery conversation
- `order-creation-flow.json` - End-to-end ordering process
- `error-handling.json` - Error recovery patterns
- `api-examples.js` - Reusable API integration code

## Integration Notes

### Voice Optimization
- All API responses include conversation-friendly summaries
- Error messages are designed for text-to-speech output
- Product descriptions are concise but informative

### Context Management
- Use Voiceflow variables to maintain conversation state
- Preserve customer_id, store_id, and order details across flows
- Handle interruptions and conversation restarts gracefully

### Error Handling
- Always implement try/catch blocks around API calls
- Provide helpful guidance when APIs return validation errors
- Have fallback flows for rate limiting and connection issues

For detailed API documentation, see `/docs/EDGE_FUNCTIONS_GUIDE.md`. 