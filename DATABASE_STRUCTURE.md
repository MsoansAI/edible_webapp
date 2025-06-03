# Edible Arrangements MVP Database Structure

## 🎯 **Project Overview**

This database powers an AI-driven e-commerce platform for Edible Arrangements, featuring:
- **Normalized tables** for data integrity and web app functionality
- **Flat tables** with JSONB for optimized AI chatbot performance
- **Allergy safety** through ingredient tracking and customer preference matching

**Supabase Project**: `jfjvqylmjzprnztbfhpa` (edible-arrangements-mvp)
**Total Tables**: 21 (17 normalized + 4 flat tables)

---

## 📊 **Database Architecture**

### **Dual Architecture Strategy**
1. **Normalized Tables (17)**: Maintain data integrity, support complex queries for web app/dashboard
2. **Flat Tables (4)**: JSONB-optimized for single-query AI chatbot operations

---

## 🛍️ **PRODUCTS & CATALOG (7 tables)**

### `products` - Core Product Information
```sql
id                  UUID PRIMARY KEY
product_identifier  INTEGER UNIQUE (4-digit: 1000-9999)
name               TEXT
description        TEXT  
base_price         DECIMAL(10,2)
image_url          TEXT
is_active          BOOLEAN
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### `product_options` - Product Variants
```sql
id            UUID PRIMARY KEY
product_id    UUID → products(id)
option_name   TEXT (e.g., "Small", "Large", "Premium")
price         DECIMAL(10,2) (absolute price, not modifier)
description   TEXT
image_url     TEXT
is_available  BOOLEAN
```

### `addons` - Universal Add-ons (max 5)
```sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE (e.g., "Greeting Card", "Balloon")
description TEXT
price       DECIMAL(10,2)
image_url   TEXT
is_active   BOOLEAN
```

### `ingredients` - Ingredient Master List
```sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE (e.g., "strawberry", "chocolate")
is_allergen BOOLEAN
```

### `categories` - Occasions, Seasons, Dietary
```sql
id         UUID PRIMARY KEY
name       TEXT UNIQUE
type       TEXT ('occasion', 'season', 'dietary')
created_at TIMESTAMP
```

### `product_ingredients` - Product ↔ Ingredients (M:N)
```sql
product_id    UUID → products(id)
ingredient_id UUID → ingredients(id)
PRIMARY KEY (product_id, ingredient_id)
```

### `product_categories` - Product ↔ Categories (M:N)
```sql
product_id  UUID → products(id)
category_id UUID → categories(id)
PRIMARY KEY (product_id, category_id)
```

---

## 👥 **CUSTOMERS & ADDRESSES (3 tables)**

### `customers` - Customer Profiles
```sql
id                   UUID PRIMARY KEY
email               TEXT UNIQUE
first_name          TEXT
last_name           TEXT
phone               TEXT
allergies           TEXT[] (array of allergy names)
dietary_restrictions TEXT[] (vegetarian, vegan, etc.)
preferences         JSONB (favorite occasions, colors, etc.)
created_at          TIMESTAMP
last_order_at       TIMESTAMP
```

### `customer_addresses` - Customer's Own Addresses
```sql
id             UUID PRIMARY KEY
customer_id    UUID → customers(id)
label          TEXT ("Home", "Work")
street_address TEXT
city           TEXT
state          TEXT
zip_code       TEXT
country        TEXT
is_default     BOOLEAN
```

### `recipient_addresses` - Gift Delivery Addresses
```sql
id                    UUID PRIMARY KEY
customer_id           UUID → customers(id)
recipient_name        TEXT
recipient_phone       TEXT
street_address        TEXT
city                  TEXT
state                 TEXT
zip_code              TEXT
country               TEXT
delivery_instructions TEXT
```

---

## 📦 **ORDERS (4 tables)**

### `orders` - Main Order Information
```sql
id                   UUID PRIMARY KEY
customer_id          UUID → customers(id)
franchisee_id        UUID → franchisees(id)
recipient_address_id UUID → recipient_addresses(id) (NULL for pickup)
order_number         TEXT UNIQUE -- Edible format: W[store_number][sequence]-1 (e.g. W25710000001-1)
status               TEXT (pending, confirmed, preparing, shipped, delivered)
fulfillment_type     TEXT ('delivery' or 'pickup')
subtotal             DECIMAL(10,2)
tax_amount           DECIMAL(10,2)
total_amount         DECIMAL(10,2)
scheduled_date       DATE
scheduled_time_slot  TEXT
pickup_customer_name TEXT (who's picking up, if different)
special_instructions TEXT
created_at           TIMESTAMP
```

> **Note:** `order_number` is now automatically generated in Edible's internal format: `W[store_number][sequence]-1` (e.g. `W25710000001-1`), where `store_number` is the 3-digit franchisee code and `sequence` is a unique global number.

### `order_items` - Products in Orders
```sql
id                UUID PRIMARY KEY
order_id          UUID → orders(id)
product_id        UUID → products(id)
product_option_id UUID → product_options(id) (nullable)
quantity          INTEGER
unit_price        DECIMAL(10,2)
total_price       DECIMAL(10,2)
```

### `order_addons` - Add-ons for Order Items
```sql
id            UUID PRIMARY KEY
order_item_id UUID → order_items(id)
addon_id      UUID → addons(id)
quantity      INTEGER
unit_price    DECIMAL(10,2)
```

### `order_status_history` - Order Status Tracking
```sql
id         UUID PRIMARY KEY
order_id   UUID → orders(id)
status     TEXT
notes      TEXT
created_at TIMESTAMP
created_by TEXT (system, franchisee, admin)
```

---

## 🏪 **INVENTORY & STORES (2 tables)**

### `franchisees` - Store Information
```sql
id                  UUID PRIMARY KEY
store_number        INTEGER UNIQUE (3-digit: 100-999)
name                TEXT
email               TEXT
phone               TEXT
address             TEXT (full street address)
city                TEXT
state               TEXT
zip_code            TEXT
opening_hours       JSONB (day-specific hours: {"monday": "9:00am - 7:00pm"})
is_active           BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

> **Note:** Delivery zones (zip codes served) are managed in the `delivery_zones` table, not in `franchisees`.

**Opening Hours JSONB Example:**
```json
{
  "monday": "9:00am - 7:00pm",
  "tuesday": "9:00am - 7:00pm", 
  "wednesday": "9:00am - 7:00pm",
  "thursday": "9:00am - 7:00pm",
  "friday": "9:00am - 7:00pm",
  "saturday": "9:00am - 7:00pm",
  "sunday": "9:00am - 3:00pm"
}
```

**Sample Data:**
- **Store #257 San Diego**: Mon-Sat 9am-7pm, Sun 9am-3pm
- **Store #263 Torrance**: Same hours

### `delivery_zones` - Franchisee Delivery Areas
```sql
id               UUID PRIMARY KEY
franchisee_id    UUID → franchisees(id)
zip_codes        TEXT[] (array of zip codes)
delivery_fee     DECIMAL(10,2)
min_order_amount DECIMAL(10,2)
```

**Sample Data:**
- **Store #257 San Diego**: zip_codes = ["92101", ...], delivery_fee = 5.99, min_order_amount = 25.00
- **Store #263 Torrance**: zip_codes = ["90501", ...], delivery_fee = 5.99, min_order_amount = 25.00

### `inventory` - Product Availability per Store
```sql
id                 UUID PRIMARY KEY
franchisee_id      UUID → franchisees(id)
product_id         UUID → products(id)
quantity_available INTEGER
last_updated       TIMESTAMP
UNIQUE (franchisee_id, product_id)
```

---

## ⚙️ **BUSINESS RULES (2 tables)**

### `seasonal_availability` - Product Seasonality
```sql
id           UUID PRIMARY KEY
product_id   UUID → products(id)
start_date   DATE
end_date     DATE
is_available BOOLEAN
```

---

## 🤖 **CHATBOT FLAT TABLES (4 tables)**

### `chatbot_products_flat` - Product Discovery
```sql
product_id   UUID PRIMARY KEY
product_data JSONB
last_updated TIMESTAMP
```

**JSONB Structure:**
```json
{
  "product_info": {
    "id": "uuid",
    "product_identifier": 1234,
    "name": "Chocolate Berry Bouquet",
    "description": "...",
    "base_price": 45.99,
    "image_url": "...",
    "is_active": true
  },
  "options": [
    {
      "id": "uuid",
      "option_name": "Large",
      "price": 65.99,
      "description": "...",
      "image_url": "...",
      "is_available": true
    }
  ],
  "addons": [
    {
      "id": "uuid", 
      "name": "Greeting Card",
      "price": 4.99,
      "description": "..."
    }
  ],
  "ingredients": ["strawberry", "chocolate", "banana"],
  "categories": [
    {"name": "Valentine's", "type": "occasion"},
    {"name": "Romantic", "type": "season"}
  ]
}
```

### `chatbot_customers_flat` - Customer Context
```sql
customer_id  UUID PRIMARY KEY
customer_data JSONB
last_updated TIMESTAMP
```

**JSONB Structure:**
```json
{
  "customer_info": {
    "id": "uuid",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-1234",
    "allergies": ["peanut", "dairy"],
    "dietary_restrictions": ["vegetarian"],
    "preferences": {"favorite_occasions": ["birthday", "anniversary"]}
  },
  "addresses": [
    {
      "id": "uuid",
      "label": "Home",
      "street_address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "is_default": true
    }
  ],
  "recent_orders": [
    {
      "order_id": "uuid",
      "order_number": "ORD-2024-001",
      "total_amount": 67.98,
      "status": "delivered",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### `chatbot_orders_flat` - Order Tracking
```sql
order_id     UUID PRIMARY KEY
order_data   JSONB
last_updated TIMESTAMP
```

**JSONB Structure:**
```json
{
  "order_info": {
    "id": "uuid",
    "order_number": "ORD-2024-001",
    "status": "confirmed",
    "fulfillment_type": "delivery",
    "total_amount": 67.98,
    "scheduled_date": "2024-02-14",
    "scheduled_time_slot": "2:00 PM - 4:00 PM"
  },
  "items": [
    {
      "product_name": "Chocolate Berry Bouquet",
      "option_name": "Large",
      "quantity": 1,
      "unit_price": 65.99,
      "addons": [
        {"name": "Greeting Card", "price": 4.99}
      ]
    }
  ],
  "customer_info": {
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "555-1234"
  },
  "delivery_info": {
    "recipient_name": "Jane Smith",
    "address": "456 Oak Ave, Boston, MA 02101",
    "instructions": "Leave at front door"
  }
}
```

### `chatbot_franchisees_flat` - Store Information
```sql
franchisee_id   UUID PRIMARY KEY
franchisee_data JSONB
last_updated    TIMESTAMP
```

**JSONB Structure:**
```json
{
  "store_info": {
    "id": "uuid",
    "store_number": 257,
    "name": "Edible Store #257 San Diego",
    "email": "ca257@edible.store",
    "phone": "(858) 585-4156",
    "address": "4340 Genesee ave, #101, San Diego, CA 92117"
  },
  "opening_hours": {
    "monday": "9:00am - 7:00pm",
    "tuesday": "9:00am - 7:00pm",
    "wednesday": "9:00am - 7:00pm",
    "thursday": "9:00am - 7:00pm",
    "friday": "9:00am - 7:00pm",
    "saturday": "9:00am - 7:00pm",
    "sunday": "9:00am - 3:00pm"
  },
  "delivery_info": {
    "zip_codes": ["92101","92102",...],
    "delivery_fee": 5.99,
    "min_order_amount": 25.00
  },
  "inventory_summary": {
    "total_products": 45,
    "out_of_stock_count": 3,
    "low_stock_count": 7
  }
}
```

---

## 🔄 **DATA SYNCHRONIZATION**

### ✅ Automatic Flat Table Maintenance **[IMPLEMENTED]**
The flat tables are **automatically updated via database triggers** when normalized tables change:

**🔄 Sync Functions Created:**
- `sync_chatbot_products_flat()` - Rebuilds product data with options, addons, ingredients, categories
- `sync_chatbot_customers_flat()` - Rebuilds customer data with addresses and recent orders
- `sync_chatbot_orders_flat()` - Rebuilds order data with items, customer info, delivery details
- `sync_chatbot_franchisees_flat()` - Rebuilds store data with hours, delivery zones, inventory stats

**⚡ Active Triggers:**
1. **Product Updates**: Changes to `products`, `product_options`, `addons`, `product_ingredients`, or `product_categories` → auto-update `chatbot_products_flat`

2. **Customer Updates**: Changes to `customers`, `customer_addresses` → auto-update `chatbot_customers_flat`

3. **Order Updates**: Changes to `orders`, `order_items`, or `order_addons` → auto-update both `chatbot_orders_flat` and `chatbot_customers_flat` (for order history)

4. **Franchisee Updates**: Changes to `franchisees`, `delivery_zones`, or `inventory` → auto-update `chatbot_franchisees_flat`

**🧪 Tested & Verified:**
- ✅ Product name/price changes automatically sync to flat table
- ✅ Timestamps update correctly (`last_updated`)
- ✅ JSONB structure maintains proper format
- ✅ All sample data successfully populated

### Manual Sync (if needed)
```sql
-- Sync specific records
SELECT sync_chatbot_products_flat('product-uuid');
SELECT sync_chatbot_customers_flat('customer-uuid');

-- Sync all records
SELECT sync_chatbot_products_flat();
SELECT sync_chatbot_customers_flat();
SELECT sync_chatbot_orders_flat();
SELECT sync_chatbot_franchisees_flat();
```

---

## 🛡️ **ALLERGY SAFETY SYSTEM**

### How It Works
1. **Customer Allergies**: Stored in `customers.allergies` array and `chatbot_customers_flat.customer_data.allergies`
2. **Product Ingredients**: Listed in `chatbot_products_flat.product_data.ingredients`
3. **Safety Check**: AI chatbot compares customer allergies with product ingredients at query time
4. **Warning System**: If allergies match ingredients, chatbot warns customer before purchase

### Example Logic
```javascript
// Pseudocode for allergy check
const customerAllergies = customerData.allergies; // ["peanut", "dairy"]
const productIngredients = productData.ingredients; // ["strawberry", "chocolate", "peanut"]
const allergenMatch = customerAllergies.filter(allergy => 
  productIngredients.includes(allergy)
);
if (allergenMatch.length > 0) {
  showWarning(`Contains: ${allergenMatch.join(', ')}`);
}
```

---

## 🚀 **AI CHATBOT QUERY STRATEGY**

### Three-Layer Performance Optimization

**🥇 Level 1 - Fast Static Recommendations**
- No database queries
- Predefined collections cached in Voiceflow
- Ultra-low latency for browsing

**🥈 Level 2 - Structured Filtering**
- Single query to flat tables
- LLM converts intent to structured JSON
- Edge Functions handle filtering logic

**🥉 Level 3 - Complex Query Fallback** 
- Same as Level 2 but with broader interpretation
- Fallback when Level 2 returns no results
- Handles ambiguous or complex requests

---

## 📋 **MIGRATION ORDER**

When setting up the database, apply migrations in this order:

1. **Core Tables**: Products, categories, ingredients, addons
2. **Relationships**: product_ingredients, product_categories  
3. **Customers**: customers, customer_addresses, recipient_addresses
4. **Business**: franchisees, delivery_zones, seasonal_availability
5. **Orders**: orders, order_items, order_addons, order_status_history
6. **Inventory**: inventory
7. **Flat Tables**: All 4 chatbot flat tables
8. **Triggers**: Auto-sync triggers for flat table maintenance

---

## 🔧 **Key Features**

- ✅ **4-digit product identifiers** (1000-9999) for easy reference
- ✅ **Flexible pricing** via absolute prices in product_options
- ✅ **Allergy safety** through ingredient tracking
- ✅ **Pickup and delivery** support
- ✅ **Multi-address** support for gifting
- ✅ **Real-time inventory** per franchisee
- ✅ **Order status tracking** with history
- ✅ **AI-optimized queries** via flat tables
- ✅ **Seasonal product control**
- ✅ **Delivery zone management**

---

## 💡 **Usage Examples**

### Customer with Allergies
```sql
-- Check if customer can safely order a product
SELECT 
  p.product_data->'product_info'->>'name' as product_name,
  p.product_data->'ingredients' as ingredients,
  c.customer_data->'allergies' as customer_allergies
FROM chatbot_products_flat p, chatbot_customers_flat c
WHERE p.product_id = $1 AND c.customer_id = $2;
```

### Available Products at Store
```sql
-- Get products available at specific franchisee
SELECT p.product_data
FROM chatbot_products_flat p
JOIN inventory i ON p.product_id = i.product_id
WHERE i.franchisee_id = $1 AND i.quantity_available > 0;
```

### Order History for Customer
```sql
-- Get customer's recent orders
SELECT customer_data->'recent_orders'
FROM chatbot_customers_flat
WHERE customer_id = $1;
```

---

## 🎯 **Next Steps**

1. **Apply all migrations** to create the complete schema
2. **Set up RLS policies** for multi-tenant security
3. **Create sample data** for testing
4. **Build Edge Functions** for AI chatbot queries
5. **Implement flat table sync triggers**
6. **Connect to Voiceflow** for AI integration

---

*This database structure supports the complete Edible Arrangements MVP with optimized performance for both traditional web app queries and AI chatbot interactions.* 