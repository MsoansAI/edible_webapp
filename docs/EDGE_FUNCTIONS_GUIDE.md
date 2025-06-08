# Edge Functions API Reference

Complete API documentation for the Edible Arrangements Voiceflow integration backend.

## Deployed Functions

| Function | Version | Purpose | Rate Limit |
|---|---|---|---|
| `product-search` | v14 | AI-powered product discovery | 30/min |
| `cart-manager` | v1 | Real-time cart operations | 50/min |
| `customer-management` | v4 | Customer account operations | 20/min |
| `franchisee-inventory` | v8 | Store location & inventory | 15/min |
| `order` | v16 | Complete order management | 20/min |
| `order-items` | v9 | Order modification & items | 15/min |
| `user-profile` | v1 | User context for chatbot | 40/min |
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

## Cart Management API

**Endpoint**: `POST /functions/v1/cart-manager`

### Real-time Cart Validation and Enrichment
- Validates cart items against the database for price and availability.
- Enriches cart with up-to-date product details and images.
- Calculates subtotal, taxes, and shipping costs.

### Request (`validate` action)
```json
{
  "action": "validate",
  "cartItems": [
    {
      "productId": "prod-uuid-123",
      "optionId": "opt-uuid-456",
      "quantity": 2
    },
    {
      "productId": "prod-uuid-789",
      "quantity": 1
    }
  ]
}
```

### Response
```json
{
  "isValid": true,
  "validatedCart": {
    "items": [
      {
        "productId": "prod-uuid-123",
        "optionId": "opt-uuid-456",
        "quantity": 2,
        "name": "Chocolate Dipped Strawberries",
        "optionName": "Large Box",
        "unitPrice": "64.99",
        "totalPrice": "129.98",
        "imageUrl": "https://..."
      },
      {
        "productId": "prod-uuid-789",
        "quantity": 1,
        "name": "Fruit Bouquet",
        "unitPrice": "45.00",
        "totalPrice": "45.00",
        "imageUrl": "https://..."
      }
    ],
    "summary": {
      "itemCount": 3,
      "subtotal": "174.98",
      "tax": "14.44",
      "shipping": "0.00",
      "total": "189.42",
      "freeShippingEligible": true
    }
  },
  "warnings": [
    "Item 'Fruit Bouquet' is low in stock at your selected store."
  ]
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

## Franchisee Inventory API

**Endpoint**: `GET /functions/v1/franchisee-inventory/find-nearest`

### Two Usage Modes

#### 1. Find Nearest Store (ZIP Code Only)
```
GET /franchisee-inventory/find-nearest?zipCode=92101
```

#### 2. Validate Specific Store Delivery (Store + ZIP Code)
```
GET /franchisee-inventory/find-nearest?storeNumber=257&zipCode=92101
```

### Response (Find Nearest Mode)
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

### Response (Store Validation Mode - Can Deliver)
```json
{
  "canDeliver": true,
  "store": {
    "storeNumber": "257",
    "name": "Edible Arrangements #257",
    "address": "4340 Genesee Ave, San Diego, CA 92117",
    "phone": "(858) 585-4156",
    "email": "ca257@edible.store"
  },
  "deliveryInfo": {
    "fee": "$5.99",
    "minimumOrder": "$25.00",
    "estimatedTime": "Same day delivery available"
  },
  "serviceArea": {
    "zipCodes": ["92101", "92102", "92103"],
    "deliveryRadius": "15 miles"
  },
  "summary": "Great! Store #257 delivers to 92101 for $5.99"
}
```

### Response (Store Validation Mode - Cannot Deliver)
```json
{
  "canDeliver": false,
  "store": {
    "storeNumber": "257",
    "name": "Edible Arrangements #257",
    "address": "4340 Genesee Ave, San Diego, CA 92117",
    "phone": "(858) 585-4156"
  },
  "message": "Store #257 does not deliver to ZIP code 90210",
  "suggestion": "This store offers pickup, or we can find a store that delivers to your area",
  "nearestAlternative": {
    "storeNumber": "312",
    "name": "Edible Arrangements #312",
    "address": "123 Main St, Los Angeles, CA 90210",
    "phone": "(323) 555-0123",
    "deliveryInfo": {
      "fee": "5.99",
      "minimumOrder": "25.00"
    }
  }
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
- **Partial REMOVE**: Supports quantity-based removal
- **Cancellation Prevention**: Smart handoff to live agent
- **Real-time Recalculation**: Pricing is updated with every change

### Request
```json
{
  "orderNumber": "W25710000001-1",
  "items": [
    {
      "action": "add",
      "productId": "4088",
      "optionName": "Classic",
      "quantity": 1
    },
    {
      "action": "remove",
      "productId": "3075",
      "optionName": "Large"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "order": {
    "orderNumber": "W25710000001-1",
    "status": "pending-update",
    "pricing": {
      "previousTotal": "75.75",
      "newTotal": "45.21",
      "change": "-30.54"
    }
  },
  "summary": "Order updated successfully. Your new total is $45.21"
}
```

---

## User Profile API

**Endpoint**: `POST /functions/v1/user-profile`

### Chatbot Context Enrichment
- Fetches a comprehensive user profile for personalizing conversations.
- Provides authentication status, contact details, and order history.
- Used to create the `context` object for Voiceflow.

### Request
```json
{
  "userId": "auth-user-uuid-123"
}
```

### Response
```json
{
  "profile": {
    "isAuthenticated": true,
    "userId": "auth-user-uuid-123",
    "userName": "Jane Doe",
    "userEmail": "jane.doe@example.com",
    "userRole": "authenticated",
    "lastOrderDate": "2024-05-10",
    "preferredDeliveryZip": "90210",
    "lifetimeValue": 450.75
  },
  "summary": "Returning customer with 5 previous orders."
}
```

---

## Generate Embedding API

**Endpoint**: `POST /functions/v1/generate-embedding`

### AI Search Vector Generation
- Converts product text into OpenAI vector embeddings
- Used for AI-powered semantic search
- Supports on-demand or batch regeneration

### Request
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

### Store Validation Flow
1. Customer provides store number and ZIP code
2. Call `franchisee-inventory` with both parameters: `/find-nearest?storeNumber=257&zipCode=92101`
3. Check `canDeliver` field in response
4. If false, suggest pickup or alternative store from `nearestAlternative`

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