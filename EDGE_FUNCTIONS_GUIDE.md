# 🚀 Edge Functions Guide
## Complete API Reference for Edible Arrangements Platform

This guide covers all production edge functions, their purposes, input/output formats, and integration patterns.

---

## 📊 Active Edge Functions

| Function | Purpose | Rate Limit | Status |
|----------|---------|------------|--------|
| **`customer-management`** | Complete customer operations (find/create/merge) | 20/min | ✅ **ACTIVE** |
| **`product-search`** | AI-optimized product discovery & filtering | 30/min | ✅ **ACTIVE** |
| **`create-order`** | Full order processing workflow | 10/min | ✅ **ACTIVE** |
| **`franchisee-inventory`** | Store location & inventory management | 15/min | ✅ **ACTIVE** |

---

## 👤 Customer Management API

**Endpoint**: `POST /functions/v1/customer-management`

### Key Features
- **Unified System**: Handles both chatbot and web app customers
- **Conflict Resolution**: Prevents duplicate accounts automatically
- **Source Tracking**: Tracks which platform created/updated accounts
- **Smart Merging**: Combines accounts when duplicates are detected

### Request Format
```json
{
  // IDENTIFIERS (provide what's available)
  "phone": "+1234567890",              // Primary identifier for chatbots
  "email": "customer@email.com",       // Primary identifier for web apps
  "authUserId": "auth-uuid",           // Web app authentication link
  
  // CUSTOMER INFORMATION
  "firstName": "John",
  "lastName": "Smith",
  "allergies": ["nuts", "dairy"],      // Food allergies for safety
  
  // SYSTEM TRACKING
  "source": "chatbot"                  // "chatbot", "webapp", or "api"
}
```

### Response Format
```json
{
  "customer": {
    "id": "customer-uuid",
    "name": "John Smith",
    "phone": "+1234567890",
    "email": "john@email.com",
    "allergies": ["nuts"],
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

### Error Responses
```json
// Rate limit exceeded
{
  "error": "Rate limit exceeded",
  "message": "Too many customer operations. Please wait a moment.",
  "retryAfter": 60
}

// Account conflicts detected
{
  "error": "Account conflict",
  "conflicts": {
    "found": true,
    "suggestedActions": ["Link accounts", "Contact support"]
  }
}
```

---

## 🔍 Product Search API

**Endpoint**: `POST /functions/v1/product-search`

### Search Strategies
1. **Semantic Search**: Natural language queries ("chocolate strawberries for mom")
2. **Direct Lookup**: Product ID search ("product 3075")
3. **Category Filtering**: Occasion-based search ("Mother's Day gifts")

### Request Format
```json
{
  // SEARCH METHODS (use any combination)
  "query": "chocolate strawberries",   // Natural language search
  "productId": "3075",                // Direct 4-digit ID lookup
  "category": "Mother's Day",         // Occasion/season filter
  
  // FILTERING OPTIONS
  "priceRange": "budget",             // "budget"(<$50), "mid"($50-100), "premium"(>$100)
  "maxPrice": 75.00,                  // Specific price limit
  "allergens": ["nuts", "dairy"],     // Exclude allergens for safety
  
  // LOCATION & AVAILABILITY
  "franchiseeId": "store-uuid",       // Check specific store inventory
  "zipCode": "02101"                  // Find products available in area
}
```

### Response Format
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
    "ingredients": ["strawberry", "chocolate"],
    "allergens": [],
    "addons": ["Balloon Bundle ($9.99)", "Greeting Card ($4.99)"],
    "_internalId": "uuid-for-ordering"
  }],
  "totalFound": 3,
  "searchSummary": "Found 3 chocolate products for Mother's Day under $75",
  "suggestions": ["Try 'strawberry arrangements' for more options"]
}
```

---

## 🏪 Store Finder API

**Endpoint**: `GET /functions/v1/franchisee-inventory/find-nearest`

### Request Parameters
```
GET /franchisee-inventory/find-nearest?zipCode=02101
```

### Response Format
```json
{
  "store": {
    "id": "store-uuid",
    "name": "Edible Arrangements - Boston Downtown",
    "address": "789 Washington St, Boston, MA 02101",
    "phone": "617-555-0123",
    "hours": {
      "today": "9:00 AM - 6:00 PM",
      "tomorrow": "9:00 AM - 6:00 PM"
    },
    "services": {
      "delivery": {
        "available": true,
        "fee": "$5.99",
        "minimumOrder": "$25.00",
        "deliveryRadius": "15 miles"
      },
      "pickup": {
        "available": true,
        "notice": "2 hours advance notice recommended"
      }
    },
    "_internalId": "uuid-for-orders"
  },
  "alternativeStores": [...],  // Other nearby stores
  "summary": "Found your local store with same-day delivery available"
}
```

---

## 📦 Order Creation API

**Endpoint**: `POST /functions/v1/create-order`

### Request Format
```json
{
  "customer": {
    "id": "customer-uuid",            // From customer-management response
    "email": "john@email.com"
  },
  "store": {
    "franchiseeId": "store-uuid"      // From store finder response
  },
  "fulfillment": {
    "type": "delivery",               // "delivery" or "pickup"
    "scheduledDate": "2025-05-10",
    "timeSlot": "2:00 PM - 4:00 PM"
  },
  "delivery": {                       // Only for delivery orders
    "recipientName": "Mom",
    "recipientPhone": "+1234567890",
    "address": "123 Main St, Boston, MA 02101",
    "instructions": "Ring doorbell twice"
  },
  "items": [{
    "productId": "product-uuid",      // From product search response
    "optionId": "option-uuid",        // If customer chose specific option
    "quantity": 1,
    "addons": ["addon-uuid-1"]        // Selected add-ons
  }],
  "paymentMethod": "credit_card",     // Payment processing details
  "specialInstructions": "Please include extra napkins"
}
```

### Response Format
```json
{
  "order": {
    "id": "order-uuid",
    "orderNumber": "ORD-2025-000123",
    "status": "confirmed",
    "total": "$59.98",
    "breakdown": {
      "subtotal": "$54.99",
      "tax": "$4.99",
      "deliveryFee": "$0.00"
    },
    "deliveryInfo": {
      "scheduledDate": "2025-05-10",
      "timeSlot": "2:00 PM - 4:00 PM",
      "estimatedDelivery": "May 10, 3:00 PM"
    }
  },
  "confirmation": {
    "email": "Confirmation sent to john@email.com",
    "sms": "Updates will be sent to +1234567890"
  },
  "summary": "Order ORD-2025-000123 confirmed for May 10 delivery!"
}
```

---

## 🔒 Security & Authentication

### Rate Limiting
All functions implement intelligent rate limiting:
- **Automatic IP detection** from headers
- **Database-driven tracking** for accuracy
- **Graceful degradation** - allows requests if system fails
- **Clear retry guidance** in error responses

### Authentication Levels
- **Public Access**: Product search, store finder (with rate limits)
- **Customer Level**: Order creation, customer management (with user token)
- **Service Role**: AI agents and administrative operations

### Error Handling
```json
// Standard error format
{
  "error": "Error type",
  "message": "Human-readable description",
  "code": "ERROR_CODE",
  "retryAfter": 60  // For rate limits
}
```

---

## 🤖 AI Agent Integration Patterns

### For Voice Assistants
```javascript
// Step 1: Customer lookup/creation
const customer = await callCustomerManagement({
  phone: extractedPhone,
  firstName: extractedName,
  source: "chatbot"
});

// Step 2: Product search
const products = await callProductSearch({
  query: extractedQuery,
  allergens: customer.allergies,
  maxPrice: extractedBudget
});

// Step 3: Store location
const store = await callStoreFinder({
  zipCode: extractedZipCode
});

// Step 4: Order creation
const order = await callCreateOrder({
  customer: customer,
  store: store,
  items: selectedProducts,
  fulfillment: userPreference
});
```

### For Web Applications
```javascript
// Authenticated user flow
const customer = await callCustomerManagement({
  email: user.email,
  authUserId: user.id,
  source: "webapp"
});

// Continue with same product search and order flow...
```

---

## 📊 Monitoring & Analytics

### Performance Metrics
- **Response times**: < 500ms average
- **Success rates**: > 99.5% uptime
- **Rate limit efficiency**: < 1% false positives

### Usage Tracking
```sql
-- Monitor function usage
SELECT 
  endpoint,
  COUNT(*) as requests,
  AVG(request_count) as avg_per_client
FROM api_rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint;
```

---

## 🔗 Related Documentation

- **[AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md)** - Detailed AI integration examples
- **[CUSTOMER_MANAGEMENT.md](CUSTOMER_MANAGEMENT.md)** - Account conflict resolution
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Complete security documentation
- **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** - Database schema reference

---

**🎯 Production Status**: All functions tested and production-ready with enterprise security! 