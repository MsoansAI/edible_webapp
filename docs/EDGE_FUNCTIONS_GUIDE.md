# Edge Functions API Reference

Complete API documentation for the Edible Arrangements Voiceflow integration backend.

## Deployed Functions

| Function | Version | Purpose | Rate Limit |
|----------|---------|---------|------------|
| `product-search` | v14 | AI-powered product discovery | 30/min |
| `customer-management` | v4 | Customer account operations | 20/min |
| `franchisee-inventory` | v8 | Store location & inventory | 15/min |
| `order` | v16 | Complete order management | 20/min |
| `order-items` | v9 | Order modification & items | 15/min |
| `generate-embedding` | v5 | AI embedding generation | 10/min |

---

## Product Search API

**Endpoint**: `POST /functions/v1/product-search`

### Multi-Level Search Strategy
1. **Level 1**: Direct 4-digit product ID lookup
2. **Level 2**: Structured database search with filters
3. **Level 3**: AI semantic search using OpenAI embeddings

### Request
```json
{
  "query": "chocolate strawberries for birthday",
  "productId": "3075",                    // Optional: direct lookup
  "priceRange": "mid",                    // budget, mid, premium
  "allergens": ["nuts"],                  // Exclude products with allergens
  "franchiseeId": "uuid",                 // Check inventory at specific store
  "limit": 10                             // Results limit (default: 5)
}
```

### Response
```json
{
  "products": [
    {
      "productId": "3075",
      "name": "Chocolate Dipped Strawberries",
      "basePrice": "49.99",
      "description": "Fresh strawberries covered in chocolate",
      "imageUrl": "https://...",
      "options": [
        {
          "name": "Large",
          "price": "64.99",
          "description": "Serves 4-6 people"
        }
      ],
      "categories": ["Birthday", "Chocolate"],
      "ingredients": ["strawberry", "chocolate", "sugar"],
      "addons": [
        {"name": "Greeting Card", "price": "4.99"},
        {"name": "Balloon", "price": "7.99"}
      ],
      "inStock": true,
      "_internalId": "product-uuid"
    }
  ],
  "searchLevel": "semantic",
  "totalFound": 8,
  "searchSummary": "Found 8 chocolate products for birthday occasions",
  "suggestions": ["Try 'fruit arrangements' for more options"]
}
```

---

## Customer Management API

**Endpoint**: `POST /functions/v1/customer-management`

### Unified Account System
- Multi-source account tracking (chatbot, web, phone)
- Automatic duplicate detection and prevention
- Account merging for existing customers

### Request
```json
{
  "phone": "+1234567890",               // Primary identifier for voice
  "email": "customer@email.com",        // Primary identifier for web
  "authUserId": "auth-uuid",            // Web app authentication
  "firstName": "John",
  "lastName": "Smith",
  "allergies": ["nuts", "dairy"],       // For safety warnings
  "dietary_restrictions": ["vegetarian"],
  "source": "chatbot"                   // chatbot, webapp, phone
}
```

### Response
```json
{
  "customer": {
    "id": "customer-uuid",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1234567890",
    "email": "john@email.com",
    "allergies": ["nuts"],
    "preferences": {
      "accountSources": ["chatbot", "webapp"]
    },
    "isNewAccount": false,
    "_internalId": "uuid"
  },
  "orderHistory": [
    {
      "orderNumber": "W25710000001-1",
      "date": "2025-01-15",
      "total": "54.11",
      "status": "delivered",
      "itemsSummary": "Chocolate Strawberries, Large"
    }
  ],
  "summary": "Welcome back John! You have 2 previous orders."
}
```

---

## Store Location API

**Endpoint**: `GET /functions/v1/franchisee-inventory/find-nearest`

### Find Store by ZIP Code
```
GET /franchisee-inventory/find-nearest?zipCode=92101
```

### Response
```json
{
  "store": {
    "id": "franchisee-uuid",
    "storeNumber": "257",
    "name": "Edible Arrangements #257",
    "address": "4340 Genesee Ave, San Diego, CA 92117",
    "phone": "(858) 585-4156",
    "email": "ca257@edible.store",
    "hours": {
      "today": "9:00 AM - 7:00 PM",
      "week": {
        "monday": "9:00am - 7:00pm",
        "tuesday": "9:00am - 7:00pm",
        "wednesday": "9:00am - 7:00pm",
        "thursday": "9:00am - 7:00pm",
        "friday": "9:00am - 7:00pm",
        "saturday": "9:00am - 7:00pm",
        "sunday": "9:00am - 3:00pm"
      }
    },
    "services": {
      "delivery": {
        "available": true,
        "fee": "5.99",
        "minimumOrder": "25.00"
      },
      "pickup": {
        "available": true,
        "advanceNotice": "2 hours recommended"
      }
    },
    "_internalId": "uuid"
  },
  "serviceArea": {
    "zipCodes": ["92101", "92102", "92103"],
    "deliveryRadius": "15 miles"
  },
  "summary": "Found your local store with same-day delivery available"
}
```

---

## Order Management API

**Endpoint**: `/functions/v1/order`  
**Methods**: `GET`, `POST`, `PATCH`

### Create Order - POST
```json
{
  "customerId": "customer-uuid",
  "franchiseeId": "store-uuid",
  "fulfillmentType": "delivery",          // delivery or pickup
  "items": [
    {
      "productId": "3075",
      "optionName": "Large",               // Human-readable option
      "quantity": 1,
      "addons": [
        {"addonName": "Greeting Card", "quantity": 1}
      ]
    }
  ],
  "deliveryAddress": {                     // Required for delivery orders
    "recipientName": "Jane Smith",
    "recipientPhone": "+1987654321",
    "streetAddress": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "deliveryInstructions": "Leave at door"
  },
  "scheduledDate": "2025-01-20",          // Optional: future delivery
  "scheduledTimeSlot": "2:00 PM - 4:00 PM", // Optional: time preference
  "specialInstructions": "Happy Birthday message"
}
```

### Response
```json
{
  "order": {
    "orderNumber": "W25710000001-1",
    "customerId": "customer-uuid",
    "status": "pending",
    "fulfillmentType": "delivery",
    "items": [
      {
        "productName": "Chocolate Dipped Strawberries",
        "optionName": "Large",
        "quantity": 1,
        "unitPrice": "64.99",
        "totalPrice": "64.99",
        "addons": [
          {
            "name": "Greeting Card",
            "quantity": 1,
            "unitPrice": "4.99"
          }
        ]
      }
    ],
    "pricing": {
      "subtotal": "69.98",
      "taxAmount": "5.77",
      "totalAmount": "75.75"
    },
    "delivery": {
      "address": "123 Main St, Boston, MA 02101",
      "recipientName": "Jane Smith",
      "scheduledDate": "2025-01-20",
      "timeSlot": "2:00 PM - 4:00 PM"
    }
  },
  "summary": "Order W25710000001-1 created successfully for $75.75"
}
```

### Retrieve Order - GET
```
GET /functions/v1/order?orderNumber=W25710000001-1
GET /functions/v1/order?customerId=customer-uuid&latest=true
```

---

## Order Items API

**Endpoint**: `PATCH /functions/v1/order-items`

### Advanced Order Modification
- **Smart ADD**: Prevents duplicates, updates quantities instead
- **Partial REMOVE**: Remove specific quantities, not entire line items
- **Cancellation Prevention**: Blocks removing last items, redirects to live agent

### Request
```json
{
  "orderNumber": "W25710000001-1",
  "items": [
    {
      "action": "add",
      "productId": "3075",
      "optionName": "Large",
      "quantity": 2
    },
    {
      "action": "remove",
      "productId": "3076",
      "optionName": "Small",
      "quantity": 1                         // Partial removal
    },
    {
      "action": "update",
      "productId": "3077",
      "optionName": "Medium",
      "newQuantity": 3
    }
  ]
}
```

### Response - Normal Operation
```json
{
  "order": {
    "orderNumber": "W25710000001-1",
    "status": "pending",
    "items": [
      {
        "productName": "Chocolate Dipped Strawberries",
        "optionName": "Large",
        "quantity": 3,                      // Updated from smart ADD
        "unitPrice": "64.99",
        "totalPrice": "194.97"
      }
    ],
    "pricing": {
      "subtotal": "194.97",
      "taxAmount": "16.09",
      "totalAmount": "211.06"
    }
  },
  "changes": [
    "Added 2 Chocolate Dipped Strawberries (Large) - updated existing quantity to 3",
    "Removed 1 Small Fruit Arrangement"
  ],
  "summary": "Order updated successfully. New total: $211.06"
}
```

### Response - Cancellation Prevention
```json
{
  "action": "cancellation_request",
  "voiceflowAction": {
    "type": "redirect_to_live_agent",
    "reason": "order_cancellation",
    "context": {
      "orderNumber": "W25710000001-1",
      "currentTotal": "$75.75",
      "customerIntent": "cancel_entire_order"
    }
  },
  "blocked": true,
  "message": "I understand you want to remove all items. Let me connect you with a live agent who can help with cancellations."
}
```

---

## AI Embedding Generation

**Endpoint**: `POST /functions/v1/generate-embedding`

### Generate Product Embeddings
```json
{
  "productId": "3075",
  "forceRegenerate": false               // Optional: regenerate existing
}
```

### Response
```json
{
  "success": true,
  "productId": "3075",
  "embeddingGenerated": true,
  "dimensions": 1536,
  "textUsed": "Chocolate Dipped Strawberries - Fresh strawberries covered in premium chocolate...",
  "summary": "Embedding generated successfully for product 3075"
}
```

---

## Error Handling

### Rate Limiting
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please wait 30 seconds before trying again.",
  "retryAfter": 30,
  "endpoint": "product-search"
}
```

### Validation Errors
```json
{
  "error": "validation_failed",
  "message": "Product option 'Extra Large' not found for product 3075",
  "availableOptions": ["Small", "Large", "Premium"],
  "suggestion": "Try one of the available options listed above"
}
```

### Business Logic Errors
```json
{
  "error": "insufficient_inventory",
  "message": "Only 2 units available, but you requested 5",
  "available": 2,
  "requested": 5,
  "suggestion": "Reduce quantity or contact store directly"
}
```

---

## Integration Notes

### Voiceflow Integration
- All responses optimized for text-to-speech
- Error messages designed for conversational flow
- Context preservation through stateless operations
- Special handling for cancellation scenarios

### Performance Optimization
- Flat table queries for minimal response times
- Rate limiting prevents abuse
- Automatic cleanup of expired rate limits
- Vector indexing for semantic search

### Security
- Row Level Security on all database operations
- Input validation and sanitization
- Service role authentication
- CORS headers for web integration

---

## Common Usage Patterns

### Product Discovery Flow
1. Customer describes what they want
2. Call `product-search` with natural language query
3. Filter by store inventory using `franchiseeId`
4. Present options to customer

### Order Creation Flow
1. Find customer with `customer-management`
2. Find store with `franchisee-inventory`
3. Create order with `order` (POST)
4. Modify items if needed with `order-items`

### Order Modification Flow
1. Retrieve existing order with `order` (GET)
2. Apply changes with `order-items` (PATCH)
3. Handle cancellation prevention if needed
4. Confirm new totals with customer

This API provides a complete backend for conversational commerce with built-in intelligence for common customer service scenarios. 