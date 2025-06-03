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
| "deliver to Mom at..." | Delivery address | Order Creation | `/functions/v1/create-order` |

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
    "orderNumber": "ORD-2025-000001",
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

## 📦 Function 4: Order Creation
**Endpoint**: `POST /functions/v1/create-order`

### 🎤 What AI Should Collect
- Customer information (from customer-management)
- Product selection (from product-search)
- Store location (from store finder)
- Delivery details or pickup preference
- Special instructions

### 📝 JSON Input Example
```json
{
  "customer": {
    "id": "customer-uuid",
    "email": "john@email.com"
  },
  "store": {
    "franchiseeId": "store-uuid"
  },
  "fulfillment": {
    "type": "delivery",
    "scheduledDate": "2025-05-10",
    "timeSlot": "2:00 PM - 4:00 PM"
  },
  "delivery": {
    "recipientName": "Mom",
    "recipientPhone": "+15559876543",
    "address": "123 Main St, Boston, MA 02101",
    "instructions": "Ring doorbell twice"
  },
  "items": [{
    "productId": "product-uuid",
    "optionId": "option-uuid",
    "quantity": 1,
    "addons": ["addon-uuid-1"]
  }],
  "specialInstructions": "Include extra napkins"
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

7. → Call create-order API

8. AI: "Perfect! Order ORD-2025-000123 confirmed for tomorrow 2-4 PM delivery!"
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