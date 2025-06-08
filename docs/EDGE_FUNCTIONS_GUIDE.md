# Edge Functions API Reference

Complete API documentation for the Edible Arrangements Voiceflow integration backend.

## Deployed Functions

| Function | Version | Purpose | Rate Limit |
|---|---|---|---|
| `product-search` | v14 | AI-powered product discovery | 30/min |
| `cart-manager` | v1 | Real-time cart operations | 50/min |
| `customer-management` | v7 | Enhanced customer profile management | 20/min |
| `franchisee-inventory` | v8 | Store location & inventory | 15/min |
| `order` | v23 | Voice-friendly order creation with fixed numbering | 20/min |
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

## Cart Management API ⭐ ENHANCED

**Endpoint**: `POST /functions/v1/cart-manager`

### Voice Bot Integration & Real-time Cart Management
- **⭐ Voice-Friendly Identifiers**: Supports 4-digit product IDs (e.g., "3075") and option names (e.g., "Large", "Small")
- **⭐ Backward Compatibility**: Maintains UUID support for web applications
- Validates cart items against the database for price and availability
- Enriches cart with up-to-date product details and images
- Calculates subtotal, taxes, and shipping costs
- Action-based API for chatbot workflows

### Actions

#### `add` - Add Product to Cart ⭐ ENHANCED
```json
{
  "action": "add",
  "productId": "3075",               // ⭐ NEW: 4-digit ID OR UUID
  "optionName": "Large",             // ⭐ NEW: Human-readable option name
  "quantity": 2
}
```

**Alternative (Legacy UUID format):**
```json
{
  "action": "add",
  "productId": "prod-uuid-123",      // Traditional UUID
  "optionId": "opt-uuid-456",        // Traditional option UUID
  "quantity": 2
}
```

#### `get` - Get Product Details
```json
{
  "action": "get",
  "productId": "3075"                
}
```

#### `validate` - Validate Cart Contents
```json
{
  "action": "validate",
  "cartData": {
    "items": [
      {
        "product": { "id": "prod-uuid-123", "name": "Strawberries" },
        "option": { "id": "opt-uuid-456", "name": "Large" },
        "quantity": 2
      }
    ]
  }
}
```

#### `summary` - Get Cart Summary ⭐ ENHANCED
```json
{
  "action": "summary",
  "cartData": {
    "items": [
      {
        "product": { 
          "id": "prod-uuid-123", 
          "base_price": "29.99",
          "product_identifier": "3075"  // ⭐ Include 4-digit ID
        },
        "option": { 
          "id": "opt-uuid-456", 
          "price": "49.99",
          "option_name": "Large"         // ⭐ Voice-friendly name
        },
        "quantity": 2
      }
    ]
  }
}
```

### Voice-Friendly Add Response ⭐ NEW
```json
{
  "success": true,
  "action": "add_to_cart",
  "message": "Added 2 Chocolate Dipped Strawberries (Large) to cart",
  "data": {
    "product": {
      "id": "prod-uuid-123",
      "name": "Chocolate Dipped Strawberries",
      "base_price": "29.99",
      "productId": "3075"              // ⭐ Include 4-digit ID for voice bots
    },
    "option": {
      "id": "opt-uuid-456",
      "option_name": "Large",
      "price": "49.99",
      "displayName": "Large"           // ⭐ Voice-friendly display name
    },
    "quantity": 2,
    "clientAction": {
      "type": "ADD_TO_CART",
      "payload": { "product": "...", "option": "...", "quantity": 2 }
    }
  }
}
```

### Voice-Friendly Summary Response ⭐ NEW
```json
{
  "success": true,
  "summary": {
    "itemCount": 3,
    "subtotal": 99.97,
    "tax": 8.25,
    "shipping": 0,
    "total": 108.22,
    "freeShippingEligible": true,
    "items": [
      {
        "name": "Chocolate Dipped Strawberries",
        "productId": "3075",           // ⭐ 4-digit ID for voice bots
        "option": "Large",             // ⭐ Human-readable option name
        "quantity": 2,
        "price": 49.99,
        "total": 99.98
      }
    ],
    "message": "You have 1 different item in your cart. Total: $108.22"
  }
}
```

### Error Handling for Voice Bots ⭐ NEW
```json
{
  "success": false,
  "message": "Option \"Extra Large\" not found for product 3075",
  "availableOptions": ["Small", "Medium", "Large"],
  "hint": "Available options: Small, Medium, Large"
}
```

---

## Customer Management API ⭐ ENHANCED

**Endpoint**: `POST /functions/v1/customer-management`

### Unified Account System & Enhanced Profiles
- Multi-source account tracking (chatbot, web, phone)
- Automatic duplicate detection and prevention
- **⭐ Enhanced Profile Fields**: Comprehensive customer preferences and details
- **⭐ Fixed Email Update Logic**: Properly updates temporary emails to real ones
- **⭐ Improved Preferences Handling**: Better tracking of profile updates
- Account merging for existing customers

### Request ⭐ ENHANCED
```json
{
  "phone": "+1234567890",               // Primary identifier for voice
  "email": "customer@email.com",        // Primary identifier for web (updates temp emails)
  "authUserId": "auth-uuid",            // Web app authentication
  "firstName": "John",
  "lastName": "Smith",
  "allergies": ["nuts", "dairy"],       // For safety warnings
  "dietaryRestrictions": ["vegetarian"], // ⭐ NEW: Enhanced dietary tracking
  "source": "chatbot",                  // chatbot, webapp, phone
  
  // ⭐ NEW: Enhanced Profile Fields
  "preferredContactMethod": "phone",    // phone, email, text
  "preferredDeliveryTime": "afternoon", // morning, afternoon, evening
  "birthday": "1985-06-15",            // YYYY-MM-DD format
  "anniversary": "2010-08-20",         // YYYY-MM-DD format  
  "occupation": "teacher",
  "householdSize": 4,
  "specialOccasions": ["birthdays", "holidays"],
  
  // ⭐ NEW: Communication Preferences
  "orderReminders": true,              // Order status notifications
  "promotionalOffers": false,          // Marketing communications
  "holidaySpecials": true              // Holiday promotion alerts
}
```

### Response ⭐ ENHANCED
```json
{
  "customer": {
    "id": "customer-uuid",
    "firstName": "John",
    "lastName": "Smith",
    "name": "John Smith",               // ⭐ Full name convenience field
    "phone": "+1234567890",
    "email": "john@email.com",          // ⭐ Properly updated from temp emails
    "allergies": ["nuts"],
    "dietaryRestrictions": ["vegetarian"], // ⭐ Enhanced dietary info
    "preferences": {
      "accountSources": ["chatbot", "webapp"],
      "preferredContactMethod": "phone",  // ⭐ NEW: Contact preferences
      "preferredDeliveryTime": "afternoon",
      "birthday": "1985-06-15",
      "anniversary": "2010-08-20",
      "occupation": "teacher",
      "householdSize": 4,
      "communicationPreferences": {      // ⭐ NEW: Communication settings
        "orderReminders": true,
        "promotionalOffers": false,
        "holidaySpecials": true
      }
    },
    "isNewAccount": false,
    "accountSources": ["chatbot", "webapp"], // ⭐ Quick access to sources
    "_internalId": "uuid"
  },
  "orderHistory": [
    {
      "orderNumber": "W25700000001-1",   // ⭐ Fixed order number format
      "date": "2025-01-15",
      "total": "54.11",
      "status": "delivered",
      "itemsSummary": "Chocolate Strawberries, Large"
    }
  ],
  "summary": "Welcome back John! I see you have 2 previous orders. What can I help you with today?"
}
```

### Key Bug Fixes ⭐ NEW
- **Email Update Logic**: Fixed contradictory logic that prevented updating temporary emails
- **Preferences Handling**: Improved update detection for preference changes
- **Source Tracking**: Better handling of multi-source account updates
- **Profile Completeness**: Enhanced tracking of profile field updates

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

## Order Management API ⭐ ENHANCED

**Endpoint**: `/functions/v1/order`  
**Methods**: `GET`, `POST`, `PATCH`

### Voice Bot Integration & Direct Order Creation
- **⭐ Voice-Friendly Identifiers**: Supports customer phone numbers and store numbers
- **⭐ Automatic Customer Creation**: Creates customer records for new phone numbers
- **⭐ Fixed Voice-Friendly Resolution**: Properly resolves option names to UUIDs
- **⭐ String-to-Number Conversion**: Handles both string and numeric store/product IDs
- **⭐ Backward Compatibility**: Maintains UUID support for web applications
- **⭐ Real-time Validation**: Validates products, options, and store availability
- **⭐ Fixed Order Numbering**: Store-specific sequence with proper increment logic
- **⭐ Service Role Key Required**: Uses Supabase service role key for full access
- Direct order creation without cart for voice workflows

### Create Order - POST ⭐ ENHANCED

#### Voice-Friendly Format (Recommended for Chatbots)
```json
{
  "customerPhone": "+14155551234",         // ⭐ NEW: E164 phone number
  "storeNumber": 101,                      // ⭐ NEW: Store number (voice-friendly)
  "items": [
    {
      "productId": "3075",                 // ⭐ 4-digit ID or UUID
      "productOptionId": "Large",          // ⭐ Option name or UUID
      "quantity": 1,
      "addons": [
        {"addonId": "extra-chocolate", "quantity": 1}  // ⭐ Addon name or UUID
      ]
    }
  ],
  "deliveryAddress": {                     // Required for delivery orders
    "street": "123 Main St",               // ⭐ Simplified field names
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "recipientName": "Jane Smith",
    "recipientPhone": "+19875551234",
    "specialInstructions": "Leave at door"
  },
  "scheduledDate": "2025-01-20",          // YYYY-MM-DD format
  "scheduledTimeSlot": "2:00 PM - 4:00 PM", // Time range for delivery
  "giftMessage": "Happy Birthday!",        // ⭐ NEW: Gift message support
  "specialInstructions": "Include gift wrapping"
}
```

#### Legacy UUID Format (Web Applications)
```json
{
  "customerId": "customer-uuid",
  "franchiseeId": "store-uuid",
  "items": [
    {
      "productId": "prod-uuid-123",
      "productOptionId": "opt-uuid-456",
      "quantity": 1
    }
  ],
  "deliveryAddress": {
    "recipientName": "Jane Smith",
    "recipientPhone": "+1987654321",
    "streetAddress": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "deliveryInstructions": "Leave at door"
  },
  "scheduledDate": "2025-01-20",
  "scheduledTimeSlot": "2:00 PM - 4:00 PM"
}
```

### Fulfillment Types ⭐ ENHANCED

#### Pickup Orders (No deliveryAddress)
```json
{
  "customerPhone": "+14155551234",
  "storeNumber": 101,
  "items": [
    {
      "productId": "3075",
      "quantity": 1
    }
  ],
  "scheduledDate": "2025-01-20",
  "scheduledTimeSlot": "2:00 PM"              // ⭐ Specific time for pickup
}
```

#### Delivery Orders (Include deliveryAddress)
- Automatically detected when `deliveryAddress` is provided
- Time slots should be ranges (e.g., "2:00 PM - 4:00 PM")
- All address fields except specialInstructions are required

### Response ⭐ ENHANCED
```json
{
  "success": true,
  "order": {
    "orderNumber": "W10100000001-1",         // ⭐ Fixed store-specific format (store 101)
    "customerId": "customer-uuid",           // ⭐ Resolved from phone
    "customerPhone": "+14155551234",         // ⭐ Voice-friendly reference
    "storeNumber": 101,                      // ⭐ Voice-friendly store ID
    "status": "pending",
    "fulfillmentType": "delivery",           // ⭐ Auto-detected
    "items": [
      {
        "productName": "Chocolate Dipped Strawberries",
        "productId": "3075",                 // ⭐ Include 4-digit ID
        "optionName": "Large",
        "quantity": 1,
        "unitPrice": "64.99",
        "totalPrice": "64.99",
        "addons": [
          {
            "name": "Extra Chocolate",
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
    },
    "giftMessage": "Happy Birthday!",        // ⭐ NEW: Gift message
    "specialInstructions": "Include gift wrapping"
  },
  "summary": "Order W10100000001-1 created successfully for $75.75. Delivery scheduled for January 20th between 2:00 PM - 4:00 PM."
}
```

### Voice-Friendly Error Handling ⭐ NEW

#### Invalid Product Error
```json
{
  "error": "Product 3999 not found or inactive",
  "hint": "Use 4-digit product ID (e.g., '3075') or valid product UUID",
  "availableProducts": ["3075", "3076", "3080"],
  "suggestion": "Try product 3075 for Chocolate Dipped Strawberries"
}
```

#### Invalid Customer/Store Error
```json
{
  "error": "Customer not found for phone +14155551234",
  "hint": "New customers will be created automatically. Check phone format (E164)",
  "example": {
    "customerPhone": "+14155551234",
    "storeNumber": 101
  }
}
```

#### Invalid Option Error
```json
{
  "error": "Option 'Extra Large' not found for product 3075",
  "availableOptions": ["Small", "Medium", "Large"],
  "suggestion": "Try 'Large' for this product"
}
```

### Retrieve Order - GET ⭐ ENHANCED
```
GET /functions/v1/order?orderNumber=W10100000001-1
GET /functions/v1/order?customerId=customer-uuid&latest=true
GET /functions/v1/order?customerPhone=+14155551234&latest=true  // ⭐ NEW: Phone lookup
```

### Order Number Format ⭐ FIXED
- **Format**: `W[store_number][8-digit-sequence]-1`
- **Store 257**: `W25700000001-1`, `W25700000002-1`, `W25700000003-1`
- **Store 101**: `W10100000001-1`, `W10100000002-1`, `W10100000003-1`
- **⭐ Fixed**: Sequence now increments properly within each store
- **⭐ Fixed**: No longer concatenates store number with sequence incorrectly

### Authentication Requirements ⭐ IMPORTANT
- **Service Role Key Required**: Order endpoint requires Supabase service role key
- **Not Anonymous**: Cannot use anonymous/anon key for order creation
- **Postman Testing**: Use `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

### Key Bug Fixes ⭐ NEW
- **UUID Variable Resolution**: Fixed using `resolvedCustomerId`/`resolvedFranchiseeId` instead of input variables
- **Voice Option Resolution**: Fixed proper resolution of option names to UUIDs
- **String Conversion**: Added robust string-to-number conversion for all identifiers
- **Schema Compliance**: Removed non-existent database fields causing insertion errors
- **Order Numbering**: Fixed regex parsing for proper sequence increment logic

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
  "orderNumber": "W25700000001-1",      // ⭐ Fixed order number format
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