# AI Agent Integration Guide 🤖
## Edge Functions Input Requirements & Data Collection

This guide shows exactly what data your AI agent needs to collect from customers and how to format it for the Edible Arrangements edge functions.

---

## 🎯 Quick Reference: Customer Data → JSON Mapping

| **Customer Says** | **AI Collects** | **JSON Field** | **Function** |
|------------------|-----------------|----------------|--------------|
| "chocolate strawberries" | Search query | `{"query": "chocolate strawberries"}` | Product Search |
| "product 3075" | Product ID | `{"productId": "3075"}` | Product Search |
| "under $50" | Price limit | `{"priceRange": "budget"}` | Product Search |
| "my phone is 555-1234" | Phone number | `{"phone": "+1555123400"}` | Customer Lookup |
| "zip code 02101" | Location | `{"zipCode": "02101"}` | Store Finder |
| "deliver to 123 Main St" | Address | `{"deliveryAddress": {...}}` | Order Creation |

---

## 📞 Function 1: Product Search
**Endpoint**: `POST /functions/v1/product-search`

### 🎤 What AI Agent Should Ask
- "What products are you looking for?"
- "Any price range in mind?"
- "Is this for a special occasion?"
- "Do you have any allergies I should know about?"

### 📝 JSON Input Options (All Optional - Use What's Available)

```json
{
  // CUSTOMER SEARCH METHODS (Pick one or combine)
  "query": "chocolate strawberries for mom",     // Natural language search
  "productId": "3075",                          // Direct 4-digit ID lookup
  "category": "Mother's Day",                   // Occasion/category filter
  
  // PRICE FILTERING (Customer budget preferences)
  "priceRange": "budget",                       // "budget" (<$50), "mid" ($50-100), "premium" (>$100)
  "maxPrice": 75.00,                           // Specific maximum price
  "minPrice": 25.00,                           // Specific minimum price
  
  // CUSTOMER SAFETY & PREFERENCES
  "allergens": ["nuts", "dairy"],              // Customer allergies to avoid
  "occasion": "mother's day",                  // Special occasion context
  "recipient": "mom",                          // Who it's for (optional context)
  
  // LOCATION-BASED (If customer mentions specific store)
  "franchiseeId": "store-uuid"                 // Check availability at specific store
}
```

### 🎯 AI Agent Conversation Flow
```
Customer: "I need something chocolatey for Mother's Day under $60"
AI Collects: query="chocolate", category="Mother's Day", maxPrice=60
JSON Sent: {"query": "chocolate", "category": "Mother's Day", "maxPrice": 60}
```

### ✅ Response Format (What AI Gets Back)
```json
{
  "products": [{
    "productId": "3075",
    "name": "Chocolate Dipped Strawberries Box", 
    "price": "$49.99",
    "description": "Our legendary chocolate-covered strawberries...",
    "options": [{"name": "Large", "price": "$65.99"}],
    "allergens": [],
    "availableAddons": ["Balloon Bundle ($9.99)"],
    "_internalId": "uuid-for-next-api-calls"
  }],
  "summary": "Found 3 chocolate products for Mother's Day under $60"
}
```

---

## 👤 Function 2: Customer Management
**Endpoints**: 
- `POST /customer-management/lookup` (Find existing)
- `POST /customer-management/find-or-create` (Create if needed)

### 🎤 What AI Agent Should Ask
- "What's your phone number?" (Primary identifier)
- "What's your email address?" (Backup identifier)
- "What's your first and last name?"
- "Any food allergies I should know about?"

### 📝 JSON Input for Customer Lookup

```json
{
  // PRIMARY IDENTIFIERS (Need at least one)
  "phone": "+1234567890",                      // Preferred: Most customers know this
  "email": "customer@email.com",               // Alternative identifier
  "id": "customer-uuid",                       // Internal use only
  
  // PARTIAL SEARCH (If phone/email unknown)
  "firstName": "John",                         // Can search by name
  "lastName": "Smith"                          // Combined with firstName for accuracy
}
```

### 📝 JSON Input for Customer Creation

```json
{
  // REQUIRED FIELDS
  "phone": "+1234567890",                      // Primary contact method
  
  // OPTIONAL BUT RECOMMENDED
  "email": "customer@email.com",               // Secondary contact
  "firstName": "John",                         // Personalization
  "lastName": "Smith",                         // Full identification
  
  // CUSTOMER PREFERENCES
  "allergies": ["peanuts", "shellfish"],       // Safety information
  "preferredFranchisee": "store-uuid"          // If customer mentions preferred location
}
```

### 🎯 AI Agent Conversation Flow
```
AI: "What's your phone number so I can look up your account?"
Customer: "It's 555-123-4567"
AI Collects: phone="+15551234567"
JSON Sent: {"phone": "+15551234567"}

If Not Found:
AI: "I'll create a new account. What's your email and name?"
Customer: "john@email.com, John Smith"
JSON Sent: {"phone": "+15551234567", "email": "john@email.com", "firstName": "John", "lastName": "Smith"}
```

### ✅ Response Format (What AI Gets Back)
```json
{
  "customer": {
    "name": "John Smith",
    "phone": "+1234567890",
    "email": "john@email.com", 
    "allergies": ["peanuts"],
    "_internalId": "uuid-for-order-creation"
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

## 🏪 Function 3: Store Finder
**Endpoint**: `GET /franchisee-inventory/find-nearest`

### 🎤 What AI Agent Should Ask
- "What's your zip code?" (Delivery area lookup)
- "Do you prefer pickup or delivery?"

### 📝 JSON Input (Simple GET Parameters)

```json
{
  "zipCode": "02101"                           // Customer's zip code for delivery area
}
```

### 🎯 AI Agent Conversation Flow
```
AI: "What's your zip code so I can find your local store?"
Customer: "02101"
API Call: GET /franchisee-inventory/find-nearest?zipCode=02101
```

### ✅ Response Format (What AI Gets Back)
```json
{
  "store": {
    "name": "Edible Arrangements - Boston Downtown",
    "address": "789 Washington St, Boston, MA",
    "phone": "617-555-0123",
    "hours": {"today": "9:00 AM - 6:00 PM"},
    "delivery": {
      "available": true,
      "fee": "$5.99", 
      "minimumOrder": "$25.00"
    },
    "_internalId": "uuid-for-order-creation"
  },
  "summary": "Perfect! I found your local store with delivery available."
}
```

---

## 🛒 Function 4: Order Creation
**Endpoint**: `POST /create-order`

### 🎤 What AI Agent Should Collect Throughout Conversation
- Products they want (from product search)
- Customer info (from customer lookup/creation)
- Store location (from store finder)
- Delivery address OR pickup preference
- Any special instructions

### 📝 JSON Input (Complete Order Data)

```json
{
  // REQUIRED: From previous API calls
  "customerId": "uuid-from-customer-lookup",    // Required: Customer _internalId
  "franchiseeId": "uuid-from-store-finder",     // Required: Store _internalId
  
  // REQUIRED: Products to order
  "items": [{
    "productId": "uuid-from-product-search",    // Product _internalId  
    "optionId": "uuid-from-product-options",    // Specific size/option
    "quantity": 1,                              // How many
    "addons": ["addon-uuid-1", "addon-uuid-2"] // Optional: Extra items
  }],
  
  // DELIVERY OR PICKUP
  "deliveryAddress": {                          // Only if delivery
    "street": "123 Main Street",
    "city": "Boston", 
    "state": "MA",
    "zipCode": "02101",
    "specialInstructions": "Leave at front door"
  },
  
  // OPTIONAL FIELDS
  "pickupTime": "Tomorrow 2:00 PM",            // If pickup instead of delivery
  "specialInstructions": "It's a surprise!",   // General order notes
  "giftMessage": "Happy Mother's Day!"         // Card message
}
```

### 🎯 AI Agent Conversation Flow
```
AI: "I found the Chocolate Strawberries Box for $49.99. Should I add it to your order?"
Customer: "Yes, and add a balloon bundle"

AI: "Would you like delivery or pickup?"
Customer: "Delivery to 123 Main Street, Boston"

AI: "Any special delivery instructions?"
Customer: "Leave it at the front door"

AI: "Any message for the gift card?"
Customer: "Happy Mother's Day Mom!"

Order JSON Built:
{
  "customerId": "uuid-from-customer-lookup",
  "franchiseeId": "uuid-from-store-finder", 
  "items": [{
    "productId": "strawberry-box-uuid",
    "optionId": "standard-option-uuid",
    "quantity": 1,
    "addons": ["balloon-bundle-uuid"]
  }],
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Boston",
    "state": "MA", 
    "zipCode": "02101",
    "specialInstructions": "Leave at front door"
  },
  "giftMessage": "Happy Mother's Day Mom!"
}
```

### ✅ Response Format (What AI Gets Back)
```json
{
  "order": {
    "orderNumber": "ORD-2025-000003",
    "total": "$67.98",
    "estimatedDelivery": "Tomorrow 2-4 PM",
    "items": [{
      "product": "Chocolate Dipped Strawberries Box",
      "price": "$49.99",
      "addons": ["Balloon Bundle ($9.99)"]
    }],
    "delivery": {
      "address": "123 Main Street, Boston, MA",
      "instructions": "Leave at front door"
    }
  },
  "confirmation": "Perfect! Order ORD-2025-000003 confirmed for $67.98. Delivering tomorrow 2-4 PM."
}
```

---

## 🔄 Complete AI Agent Workflow

### 1. **Product Discovery**
```json
// Customer: "I need something for Mother's Day under $50"
POST /product-search
{"query": "mother's day", "maxPrice": 50}
→ Get product options with _internalId
```

### 2. **Customer Identification**  
```json
// Customer: "My phone is 555-1234"
POST /customer-management/lookup  
{"phone": "+15551234"}
→ Get customer info with _internalId
```

### 3. **Store Location**
```json
// Customer: "My zip is 02101" 
GET /franchisee-inventory/find-nearest?zipCode=02101
→ Get store info with _internalId
```

### 4. **Order Creation**
```json
// Combine all previous _internalId values
POST /create-order
{
  "customerId": "customer-uuid",
  "franchiseeId": "store-uuid", 
  "items": [{"productId": "product-uuid", "optionId": "option-uuid", "quantity": 1}],
  "deliveryAddress": {...}
}
→ Get order confirmation
```

---

## 🤖 AI Agent Implementation Tips

### **Data Collection Strategy**
1. **Start Broad**: "What can I help you find today?"
2. **Narrow Down**: Use product search to show options
3. **Identify Customer**: Get phone number for account lookup
4. **Locate Store**: Get zip code for delivery options  
5. **Finalize Order**: Collect delivery/pickup preferences

### **Error Handling**
```json
// If product search returns no results
{"count": 0, "summary": "No products found. Try different keywords."}

// If customer not found
{"summary": "No account found. Let me create one for you."}

// If store not available  
{"summary": "No delivery to that area. Here's the nearest pickup location."}
```

### **Conversation Context**
- Always use the `summary` field from responses for natural conversation
- Keep `_internalId` values for subsequent API calls
- Use customer-friendly language from product names and descriptions
- Reference order numbers and totals in confirmations

---

## 🎯 Integration Checklist

- [ ] **VAPI Configuration**: Map conversation variables to JSON fields
- [ ] **VoiceFlow Setup**: Configure API call nodes with proper JSON formatting  
- [ ] **Error Handling**: Implement fallbacks for missing customer data
- [ ] **Data Validation**: Ensure phone numbers are formatted correctly (+1...)
- [ ] **Conversation Flow**: Test complete customer journey from search to order
- [ ] **Edge Cases**: Handle out-of-stock, delivery area limits, payment issues

---

## 🚀 Ready for Production

Your AI agent now has everything needed to:
- ✅ Collect minimal customer data through natural conversation
- ✅ Format data correctly for each edge function
- ✅ Handle the complete ordering workflow  
- ✅ Provide natural, customer-friendly responses
- ✅ Maintain context across multiple API calls

**Base URL**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/`
**Auth Header**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

*Last Updated: January 30, 2025*  
*All functions tested and optimized for AI agent integration* 