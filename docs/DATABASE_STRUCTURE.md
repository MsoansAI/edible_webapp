# Edible Arrangements Database Structure

## Overview

This database powers a complete Voiceflow chatbot integration for Edible Arrangements, featuring a dual architecture with normalized tables for data integrity and flat tables optimized for AI chatbot performance.

**Supabase Project**: `jfjvqylmjzprnztbfhpa`  
**Total Tables**: 21 (17 normalized + 4 flat tables)

## Architecture Strategy

### Normalized Tables (17)
Maintain data integrity and support complex operations for order management, customer accounts, and business operations.

### Flat Tables (4) 
JSONB-optimized denormalized views for single-query chatbot operations, automatically synchronized via database triggers.

---

## Core Schema

### Products & Catalog (7 tables)

#### `products` - Core Product Information
```sql
id                  UUID PRIMARY KEY
product_identifier  INTEGER UNIQUE (4-digit: 1000-9999) -- Customer-facing ID
name               TEXT
description        TEXT  
base_price         DECIMAL(10,2)
image_url          TEXT
is_active          BOOLEAN DEFAULT true
created_at         TIMESTAMP DEFAULT now()
updated_at         TIMESTAMP DEFAULT now()
embedding          vector(1536) -- OpenAI embeddings for semantic search
```

#### `product_options` - Product Variants & Sizes
```sql
id            UUID PRIMARY KEY
product_id    UUID → products(id)
option_name   TEXT -- Human-readable: "Large", "Birthday", "Thank You"
price         DECIMAL(10,2) -- Absolute price, not modifier
description   TEXT
image_url     TEXT
is_available  BOOLEAN DEFAULT true
```

#### `addons` - Universal Add-ons
```sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE -- "Greeting Card", "Balloon", etc.
description TEXT
price       DECIMAL(10,2)
image_url   TEXT
is_active   BOOLEAN DEFAULT true
```

#### `ingredients` - Ingredient & Allergen Tracking
```sql
id          UUID PRIMARY KEY
name        TEXT UNIQUE -- "strawberry", "chocolate", "nuts"
is_allergen BOOLEAN DEFAULT false
```

#### `categories` - Occasions & Categorization
```sql
id         UUID PRIMARY KEY
name       TEXT UNIQUE -- "Birthday", "Anniversary", "Valentine's Day"
type       TEXT CHECK (type IN ('occasion', 'season', 'dietary'))
created_at TIMESTAMP DEFAULT now()
```

#### `product_ingredients` - Many-to-Many Relationship
```sql
product_id    UUID → products(id)
ingredient_id UUID → ingredients(id)
PRIMARY KEY (product_id, ingredient_id)
```

#### `product_categories` - Many-to-Many Relationship
```sql
product_id  UUID → products(id)
category_id UUID → categories(id)
PRIMARY KEY (product_id, category_id)
```

### Customer Management (3 tables)

#### `customers` - Customer Profiles
```sql
id                   UUID PRIMARY KEY
email               TEXT UNIQUE
first_name          TEXT
last_name           TEXT
phone               TEXT
allergies           TEXT[] -- Array of allergen names
dietary_restrictions TEXT[] -- "vegetarian", "vegan", etc.
preferences         JSONB -- Account sources, preferences, etc.
created_at          TIMESTAMP DEFAULT now()
last_order_at       TIMESTAMP
auth_user_id        UUID → auth.users(id) -- For web app integration
```

#### `customer_addresses` - Customer's Personal Addresses
```sql
id             UUID PRIMARY KEY
customer_id    UUID → customers(id)
label          TEXT -- "Home", "Work", etc.
street_address TEXT
city           TEXT
state          TEXT
zip_code       TEXT
country        TEXT DEFAULT 'US'
is_default     BOOLEAN DEFAULT false
```

#### `recipient_addresses` - Gift Delivery Addresses
```sql
id                    UUID PRIMARY KEY
customer_id           UUID → customers(id)
recipient_name        TEXT
recipient_phone       TEXT
street_address        TEXT
city                  TEXT
state                 TEXT
zip_code              TEXT
country               TEXT DEFAULT 'US'
delivery_instructions TEXT
```

### Order Management (4 tables)

#### `orders` - Main Order Records
```sql
id                   UUID PRIMARY KEY
customer_id          UUID → customers(id)
franchisee_id        UUID → franchisees(id)
recipient_address_id UUID → recipient_addresses(id) -- NULL for pickup
order_number         TEXT UNIQUE -- Format: W[store_number][sequence]-1
status               TEXT DEFAULT 'pending' 
                     CHECK (status IN ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'))
fulfillment_type     TEXT DEFAULT 'delivery' 
                     CHECK (fulfillment_type IN ('delivery', 'pickup'))
subtotal             DECIMAL(10,2) CHECK (subtotal >= 0)
tax_amount           DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0)
total_amount         DECIMAL(10,2) CHECK (total_amount >= 0)
scheduled_date       DATE
scheduled_time_slot  TEXT
pickup_customer_name TEXT -- For pickup orders
special_instructions TEXT
created_at           TIMESTAMP DEFAULT now()
```

**Order Number Format**: `W[store_number][8-digit-sequence]-1`
- Example: `W25710000001-1`
- W: Prefix for all orders
- 257: 3-digit store number
- 10000001: 8-digit sequence number
- -1: Version suffix

#### `order_items` - Line Items
```sql
id                UUID PRIMARY KEY
order_id          UUID → orders(id)
product_id        UUID → products(id)
product_option_id UUID → product_options(id) -- Nullable
quantity          INTEGER CHECK (quantity > 0)
unit_price        DECIMAL(10,2) CHECK (unit_price >= 0)
total_price       DECIMAL(10,2) CHECK (total_price >= 0)
```

#### `order_addons` - Add-ons for Line Items
```sql
id            UUID PRIMARY KEY
order_item_id UUID → order_items(id)
addon_id      UUID → addons(id)
quantity      INTEGER CHECK (quantity > 0)
unit_price    DECIMAL(10,2) CHECK (unit_price >= 0)
```

#### `order_status_history` - Status Tracking
```sql
id         UUID PRIMARY KEY
order_id   UUID → orders(id)
status     TEXT
notes      TEXT
created_at TIMESTAMP DEFAULT now()
created_by TEXT DEFAULT 'system'
```

### Store & Business Management (5 tables)

#### `franchisees` - Store Locations
```sql
id                  UUID PRIMARY KEY
store_number        INTEGER UNIQUE CHECK (store_number BETWEEN 100 AND 999)
name                TEXT
email               TEXT
phone               TEXT
address             TEXT
city                TEXT
state               TEXT
zip_code            TEXT
is_active           BOOLEAN DEFAULT true
operating_hours     JSONB DEFAULT '{}'
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP DEFAULT now()
```

#### `delivery_zones` - Service Areas
```sql
id                  UUID PRIMARY KEY
franchisee_id       UUID → franchisees(id) UNIQUE
zip_codes           TEXT[] -- Array of served ZIP codes
delivery_fee        DECIMAL(10,2) CHECK (delivery_fee >= 0)
min_order_amount    DECIMAL(10,2) DEFAULT 0 CHECK (min_order_amount >= 0)
```

#### `inventory` - Real-time Stock Tracking
```sql
id                  UUID PRIMARY KEY
franchisee_id       UUID → franchisees(id)
product_id          UUID → products(id)
quantity_available  INTEGER DEFAULT 0 CHECK (quantity_available >= 0)
last_updated        TIMESTAMP DEFAULT now()
```

#### `seasonal_availability` - Product Seasonality
```sql
id           UUID PRIMARY KEY
product_id   UUID → products(id)
start_date   DATE
end_date     DATE
is_available BOOLEAN DEFAULT true
```

#### `api_rate_limits` - API Protection
```sql
id           UUID PRIMARY KEY
identifier   TEXT -- IP address or user ID
endpoint     TEXT -- Function name
request_count INTEGER DEFAULT 1
window_start TIMESTAMP DEFAULT now()
created_at   TIMESTAMP DEFAULT now()
```

### Flat Tables for AI Optimization (4 tables)

#### `chatbot_products_flat` - Denormalized Product Data
```sql
product_id   UUID PRIMARY KEY → products(id)
product_data JSONB -- Complete product with options, categories, ingredients
last_updated TIMESTAMP DEFAULT now()
```

#### `chatbot_customers_flat` - Denormalized Customer Data
```sql
customer_id   UUID PRIMARY KEY → customers(id)
customer_data JSONB -- Customer info, preferences, order history
last_updated  TIMESTAMP DEFAULT now()
```

#### `chatbot_orders_flat` - Denormalized Order Data
```sql
order_id      UUID PRIMARY KEY → orders(id)
order_data    JSONB -- Complete order with items, customer, delivery info
last_updated  TIMESTAMP DEFAULT now()
```

#### `chatbot_franchisees_flat` - Denormalized Store Data
```sql
franchisee_id   UUID PRIMARY KEY → franchisees(id)
franchisee_data JSONB -- Store info, hours, delivery zones
last_updated    TIMESTAMP DEFAULT now()
```

## Data Synchronization

### Automatic Triggers
Database triggers automatically update flat tables when normalized tables change:
- Product changes → `chatbot_products_flat`
- Customer changes → `chatbot_customers_flat` 
- Order changes → `chatbot_orders_flat`
- Store changes → `chatbot_franchisees_flat`

### JSONB Structure Examples

#### Product Data Structure
```json
{
  "product_info": {
    "id": "uuid",
    "product_identifier": "3075",
    "name": "Berry Beautiful Bouquet",
    "description": "Fresh strawberries with chocolate",
    "base_price": "49.99",
    "image_url": "https://...",
    "is_active": true
  },
  "options": [
    {
      "id": "uuid",
      "option_name": "Large",
      "price": "64.99",
      "description": "Serves 4-6",
      "image_url": "https://..."
    }
  ],
  "categories": [
    {"name": "Birthday", "type": "occasion"},
    {"name": "Valentine's Day", "type": "occasion"}
  ],
  "ingredients": ["strawberry", "chocolate", "grapes"],
  "addons": [
    {"name": "Greeting Card", "price": "4.99"},
    {"name": "Balloon", "price": "7.99"}
  ]
}
```

## Security & Constraints

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies for data access control.

### Data Validation
- Check constraints ensure data integrity
- Foreign key relationships maintain referential integrity
- Unique constraints prevent duplicates
- Default values provide sensible fallbacks

### Performance Optimization
- Indexes on frequently queried columns
- Vector indexes for semantic search
- Efficient JSONB querying in flat tables
- Trigger-based cache invalidation

## Business Logic

### Pricing System
- Products have base prices
- Options override base prices (not additive)
- Addons are additional charges
- Tax calculation: 8.25% rate
- All prices stored with 2 decimal precision

### Order Lifecycle
1. **Pending**: Initial order creation
2. **Confirmed**: Payment processed
3. **Preparing**: Being assembled
4. **Shipped**: Out for delivery
5. **Delivered**: Completed successfully
6. **Cancelled**: Order cancelled

### Customer Account Management
- Multi-source tracking (chatbot, web, phone)
- Allergy and preference management
- Address book functionality
- Order history preservation

This schema supports the complete Voiceflow chatbot experience while maintaining data integrity and performance for all operations. 