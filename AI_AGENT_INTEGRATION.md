# 🤖 AI Agent Integration Guide
## Complete Guide for Voice Assistants & Chatbots

This guide shows exactly how to integrate AI agents with the Edible Arrangements platform, including data collection patterns, API calls, and conversation flows.

---

## 🎯 Quick Reference: Customer Input → API Calls

| **Customer Says** | **AI Extracts** | **API Call** | **Endpoint** |
|------------------|-----------------|--------------|--------------|
| "chocolate strawberries" | Search query | Product Search | `/functions/v1/product-search` |
| "product 3075" | Product ID | Product Lookup | `/functions/v1/product-search` |
| "under $50" | Price limit | Filtered Search | `/functions/v1/product-search` |
| "my phone is 555-1234" | Phone number | Customer Lookup | `/functions/v1/customer-management` |
| "zip code 02101" | Location | Store Finder | `/functions/v1/franchisee-inventory` |
| "deliver to Mom at..." | Delivery address | Create Order | `/functions/v1/order` (POST) |
| "what's my last order?" | Order lookup | Get Recent Order | `/functions/v1/order` (GET) |
| "order number ending 0001" | Order number | Get Order by Number | `/functions/v1/order` (GET) |
| "change delivery instructions" | Order update | Update Order | `/functions/v1/order` (PATCH) |

---

## 📞 Function 1: Customer Management
**Endpoint**: `POST /functions/v1/customer-management`

### 🎤 What AI Should Ask
- "What's your phone number?" (Primary identifier)
- "What's your email address?" (Secondary identifier)
- "What's your first and last name?"
- "Any food allergies I should know about?"

### 📝 JSON Input Examples

**Customer Lookup (Existing Customer)**:
```json
{
  "phone": "+15551234567",
  "source": "chatbot"
}
```

**Customer Creation (New Customer)**:
```json
{
  "phone": "+15551234567",
  "email": "john@email.com",
  "firstName": "John",
  "lastName": "Smith",
  "allergies": ["peanuts", "shellfish"],
  "source": "chatbot"
}
```

**Web App User (Authenticated)**:
```json
{
  "email": "user@email.com",
  "authUserId": "auth-uuid-from-supabase",
  "phone": "+15551234567",
  "source": "webapp"
}
```

### 🎯 AI Conversation Flow
```
AI: "Hi! What's your phone number so I can look up your account?"
Customer: "It's 555-123-4567"
AI Processes: phone="+15551234567", source="chatbot"

API Call: POST /customer-management
{
  "phone": "+15551234567",
  "source": "chatbot"
}

If Customer Found:
  → Continue with "Welcome back [Name]! How can I help today?"
  
If Customer Not Found:
  AI: "I'll create a new account. What's your email and name?"
  Customer: "john@email.com, I'm John Smith"
  
  API Call: POST /customer-management
  {
    "phone": "+15551234567",
    "email": "john@email.com", 
    "firstName": "John",
    "lastName": "Smith",
    "source": "chatbot"
  }
```

### ✅ Response Format
```json
{
  "customer": {
    "id": "uuid",
    "name": "John Smith",
    "phone": "+15551234567",
    "email": "john@email.com",
    "allergies": ["peanuts"],
    "isNewAccount": false,
    "accountSources": ["chatbot", "webapp"],
    "_internalId": "uuid-for-orders"
  },
  "orderHistory": [{
    "orderNumber": "W25710000001-1",
    "date": "Jun 1, 2025",
    "total": "$54.11",
    "status": "Delivered",
    "items": "Chocolate Strawberries Box"
  }],
  "summary": "Welcome back John! You have 2 previous orders."
}
```

---

## 🔍 Function 2: Product Search
**Endpoint**: `POST /functions/v1/product-search`

### 🎤 What AI Should Ask
- "What products are you looking for?"
- "Any price range in mind?"
- "Is this for a special occasion?"
- "Do you have any allergies I should avoid?"

### 📝 JSON Input Examples

**Natural Language Search**:
```json
{
  "query": "chocolate strawberries for mom",
  "occasion": "mother's day",
  "maxPrice": 60.00,
  "allergens": ["nuts"]
}
```

**Direct Product Lookup**:
```json
{
  "productId": "3075"
}
```

**Category-Based Search**:
```json
{
  "category": "Mother's Day",
  "priceRange": "budget",
  "allergens": ["dairy", "nuts"]
}
```

### 🎯 AI Conversation Flow
```
Customer: "I need something chocolatey for Mother's Day under $60"

AI Extracts:
- query: "chocolate"
- occasion: "mother's day"
- maxPrice: 60
- recipient: "mom"

API Call: POST /product-search
{
  "query": "chocolate",
  "category": "Mother's Day",
  "maxPrice": 60.00,
  "occasion": "mother's day"
}

AI Response: "I found 3 perfect chocolate options for Mother's Day under $60. 
The most popular is our Chocolate Dipped Strawberries Box for $49.99..."
```

### ✅ Response Format
```json
{
  "products": [{
    "productId": "3075",
    "name": "Chocolate Dipped Strawberries Box",
    "basePrice": "$49.99",
    "description": "Our legendary chocolate-covered strawberries...",
    "imageUrl": "https://...",
    "options": [{
      "name": "Large",
      "price": "$65.99",
      "description": "Premium size with extra strawberries"
    }],
    "categories": ["Mother's Day", "Chocolate"],
    "allergens": [],
    "addons": ["Balloon Bundle ($9.99)", "Greeting Card ($4.99)"],
    "_internalId": "uuid-for-ordering"
  }],
  "totalFound": 3,
  "searchSummary": "Found 3 chocolate products for Mother's Day under $60",
  "suggestions": ["Try 'strawberry arrangements' for more options"]
}
```

---

## 🏪 Function 3: Store Finder
**Endpoint**: `GET /functions/v1/franchisee-inventory/find-nearest`

### 🎤 What AI Should Ask
- "What's your zip code?" (Delivery area lookup)
- "Do you prefer pickup or delivery?"

### 📝 API Call Format
```
GET /franchisee-inventory/find-nearest?zipCode=02101
```

### 🎯 AI Conversation Flow
```
AI: "What's your zip code so I can find your local store?"
Customer: "02101"

API Call: GET /franchisee-inventory/find-nearest?zipCode=02101

AI Response: "Perfect! I found your local Boston Downtown store. 
They offer delivery for $5.99 and are open until 6 PM today."
```

### ✅ Response Format
```json
{
  "store": {
    "id": "store-uuid",
    "name": "Edible Arrangements - Boston Downtown",
    "address": "789 Washington St, Boston, MA 02101",
    "phone": "617-555-0123",
    "hours": {"today": "9:00 AM - 6:00 PM"},
    "delivery": {
      "available": true,
      "fee": "$5.99",
      "minimumOrder": "$25.00"
    },
    "_internalId": "uuid-for-orders"
  },
  "summary": "Found your local store with delivery available"
}
```

---

## 📦 Function 4: Unified Order Management
**Endpoint**: `/functions/v1/order`
**Methods**: `GET`, `POST`, `PATCH`

### 🎤 What AI Should Ask/Collect

**For Creating Orders (POST):**
- Customer information (from customer-management)
- Product selection (from product-search)
- Store location (from store finder)
- Delivery details or pickup preference
- Special instructions

**For Retrieving Orders (GET):**
- "What's your most recent order?"
- "What are the last 4 digits of your order number?"

**For Updating Orders (PATCH):**
- "What would you like to change about your order?"
- "Any new delivery instructions?"

### 📝 JSON Input Examples

**GET: Retrieve Most Recent Order**
```
GET /functions/v1/order?customerId=customer-uuid&outputType=streamlined
```

**GET: Find Order by Last 4 Digits**
```
GET /functions/v1/order?orderNumber=0001&outputType=json
```

**POST: Create New Order**
```json
{
  "customerId": "customer-uuid",
  "franchiseeId": "store-uuid",
  "items": [{
    "productId": "product-uuid",
    "optionId": "option-uuid",
    "quantity": 1,
    "addons": ["addon-uuid-1"]
  }],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "specialInstructions": "Ring doorbell twice"
  },
  "specialInstructions": "Include extra napkins",
  "outputType": "streamlined"
}
```

**PATCH: Update Existing Order**
```json
{
  "orderId": "order-uuid",
  "updates": {
    "special_instructions": "Leave at back door",
    "scheduled_time_slot": "3:00 PM - 5:00 PM"
  },
  "outputType": "streamlined"
}
```

### 🎯 Complete AI Conversation Flow
```
1. Customer: "I want to order chocolate strawberries for my mom"

2. AI: "What's your phone number?"
   → Call customer-management API

3. AI: "Found your account! I have chocolate strawberries for $49.99. Sound good?"
   → Call product-search API

4. AI: "What's your zip code for delivery?"
   → Call store finder API

5. AI: "When would you like this delivered?"
   Customer: "Tomorrow between 2-4 PM"

6. AI: "What's your mom's address?"
   Customer: "123 Main St, Boston, MA 02101"

7. → Call POST /order API

8. AI: "Perfect! Order W25710000003-1 confirmed for tomorrow 2-4 PM delivery!"

--- NEW CAPABILITIES ---

9. Customer (later): "What was my last order?"
   → Call GET /order?customerId=uuid

10. Customer: "I need to change the delivery instructions"
    → Call PATCH /order with updates

11. Customer: "What's order ending in 0003?"
    → Call GET /order?orderNumber=0003
```

### ✅ Response Formats

**GET Response (Streamlined)**:
```json
{
  "order": {
    "orderNumber": "W25710000001-1",
    "status": "pending",
    "total": "$54.11",
    "estimatedDelivery": "Tomorrow 2-4 PM",
    "items": [{
      "product": "Chocolate Strawberries Box",
      "price": "$49.99",
      "quantity": 1,
      "addons": ["Greeting Card ($4.99)"]
    }],
    "delivery": {
      "address": "123 Main St, Boston, MA",
      "instructions": "Ring doorbell"
    }
  },
  "summary": "Found order W25710000001-1 for you."
}
```

**POST Response (Order Creation)**:
```json
{
  "order": {
    "orderNumber": "W25710000003-1",
    "total": "$59.98",
    "estimatedDelivery": "Tomorrow 2-4 PM",
    "items": [{
      "product": "Chocolate Strawberries Box",
      "price": "$54.99",
      "quantity": 1
    }],
    "delivery": {
      "address": "123 Main St, Boston, MA",
      "instructions": "Ring doorbell twice"
    }
  },
  "confirmation": "Perfect! Order W25710000003-1 confirmed for $59.98. Delivering tomorrow 2-4 PM to 123 Main St."
}
```

**PATCH Response (Order Update)**:
```json
{
  "order": {
    "orderNumber": "W25710000001-1",
    "status": "pending",
    "total": "$54.11",
    "estimatedDelivery": "June 5, 3-5 PM"
  },
  "summary": "Order W25710000001-1 updated successfully."
}
```

**Error Handling for Updates**:
```json
{
  "error": "Order cannot be modified",
  "message": "Order W25710000001-1 is shipped and cannot be modified.",
  "currentStatus": "shipped"
}
```

---

## 🛡️ Security & Rate Limiting for AI Agents

### Authentication
```javascript
// Use service role key for AI agents
const headers = {
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
}
```

### Rate Limit Handling
```javascript
async function callWithRetry(endpoint, data) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    // AI should respond: "I'm processing a lot of requests right now. 
    // Let me try again in a moment..."
    await delay(retryAfter * 1000);
    return callWithRetry(endpoint, data);
  }
  
  return response.json();
}
```

### Error Handling for AI
```javascript
// Convert API errors to natural language
function handleAPIError(error) {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return "I'm processing a lot of orders right now. Let me try again in a moment.";
    case 'CUSTOMER_NOT_FOUND':
      return "I couldn't find your account. Let me create a new one for you.";
    case 'PRODUCT_NOT_AVAILABLE':
      return "That product isn't available right now. Let me show you similar options.";
    default:
      return "I'm having a small technical issue. Let me try that again.";
  }
}
```

---

## 🎪 Advanced AI Integration Patterns

### Context Preservation
```javascript
// Maintain conversation context across API calls
class ConversationContext {
  constructor() {
    this.customer = null;
    this.searchResults = [];
    this.selectedProducts = [];
    this.deliveryInfo = null;
  }
  
  async handleCustomerInfo(phone) {
    this.customer = await callCustomerManagement({
      phone: phone,
      source: "chatbot"
    });
    return this.customer;
  }
  
  async searchProducts(query) {
    this.searchResults = await callProductSearch({
      query: query,
      allergens: this.customer?.allergies || []
    });
    return this.searchResults;
  }
}
```

### Smart Fallbacks
```javascript
// Handle partial information gracefully
async function intelligentProductSearch(userInput) {
  // Try exact product ID first
  if (userInput.match(/\d{4}/)) {
    const productId = userInput.match(/\d{4}/)[0];
    return await callProductSearch({ productId });
  }
  
  // Try category matching
  const categories = ['Mother\'s Day', 'Valentine\'s', 'Birthday'];
  const matchedCategory = categories.find(cat => 
    userInput.toLowerCase().includes(cat.toLowerCase())
  );
  
  if (matchedCategory) {
    return await callProductSearch({ 
      category: matchedCategory,
      query: userInput 
    });
  }
  
  // Fall back to general search
  return await callProductSearch({ query: userInput });
}
```

### Proactive Assistance
```javascript
// Suggest next steps based on context
function getNextSuggestion(context) {
  if (!context.customer) {
    return "I'll need your phone number to get started.";
  }
  
  if (!context.searchResults.length) {
    return "What products are you looking for today?";
  }
  
  if (!context.selectedProducts.length) {
    return "Which of these products would you like to order?";
  }
  
  if (!context.deliveryInfo) {
    return "Would you like pickup or delivery?";
  }
  
  return "I have everything I need. Should I place your order?";
}
```

---

## 🔧 Implementation Checklist

### ✅ Required Setup
- [ ] **Service Role Key**: Configure SUPABASE_SERVICE_ROLE_KEY
- [ ] **Error Handling**: Implement graceful API error responses
- [ ] **Rate Limiting**: Add retry logic with delays
- [ ] **Context Management**: Maintain conversation state
- [ ] **Natural Language**: Convert API responses to conversational text

### 🎯 Testing Scenarios
- [ ] **New Customer Flow**: Phone → Account Creation → Product Search → Order
- [ ] **Returning Customer**: Phone → Account Found → Browse History → New Order
- [ ] **Error Recovery**: Rate Limits → Retry → Success
- [ ] **Allergy Safety**: Customer Allergies → Filtered Products → Safe Recommendations

---

## 🔗 Related Documentation

- **[EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md)** - Complete API reference
- **[CUSTOMER_MANAGEMENT.md](CUSTOMER_MANAGEMENT.md)** - Account conflict resolution
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Security policies and implementation
- **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** - Data schema reference

---

**🚀 Ready to Build**: Everything you need to create a production-ready AI voice agent!

## 🛠️ Example: PATCH /functions/v1/order with curl

Below are example curl commands for updating an order using the PATCH method. Adjust the payload according to the type of change you want to make.

### 1. Change Delivery Address
```bash
curl -X PATCH https://<YOUR_PROJECT>.functions.supabase.co/functions/v1/order \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<order-uuid>",
    "updates": {
      "delivery_address": {
        "street": "456 Oak Ave",
        "city": "Cambridge",
        "state": "MA",
        "zipCode": "02139",
        "specialInstructions": "Leave at front desk"
      }
    },
    "outputType": "streamlined"
  }'
```

### 2. Change Delivery Time (Date/Time Slot)
```bash
curl -X PATCH https://<YOUR_PROJECT>.functions.supabase.co/functions/v1/order \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<order-uuid>",
    "updates": {
      "scheduled_date": "2025-06-05",
      "scheduled_time_slot": "4:00 PM - 6:00 PM"
    },
    "outputType": "streamlined"
  }'
```

### 3. Change Pickup Time
```bash
curl -X PATCH https://<YOUR_PROJECT>.functions.supabase.co/functions/v1/order \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<order-uuid>",
    "updates": {
      "scheduled_date": "2025-06-06",
      "scheduled_time_slot": "11:00 AM - 12:00 PM"
    },
    "outputType": "streamlined"
  }'
```

### 4. Change Pickup Customer Name
```bash
curl -X PATCH https://<YOUR_PROJECT>.functions.supabase.co/functions/v1/order \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "<order-uuid>",
    "updates": {
      "pickup_customer_name": "Jane Smith"
    },
    "outputType": "streamlined"
  }'
```

**Notes:**
- Only include the fields you want to update in the `updates` object.
- For delivery orders, use `delivery_address` and/or `scheduled_date`, `scheduled_time_slot`.
- For pickup orders, use `pickup_customer_name`, `scheduled_date`, `scheduled_time_slot`.
- The `outputType` parameter is optional; use `"streamlined"` for a simplified response or `"json"` for the full order object.
- Replace `<YOUR_PROJECT>`, `<YOUR_TOKEN>`, and `<order-uuid>` with your actual values. 