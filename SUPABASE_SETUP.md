# 🔧 Supabase Setup & Configuration
## Project Credentials and Connection Guide

This guide provides all the necessary information to connect to and use the Edible Arrangements Supabase project.

---

## 🔑 Project Information

**Project ID**: `jfjvqylmjzprnztbfhpa`  
**Project Name**: `edible-arrangements-mvp`  
**Organization**: MsoansAI's Org  
**Region**: us-east-1  
**Monthly Cost**: $10

**Project URL**: `https://jfjvqylmjzprnztbfhpa.supabase.co`  
**Database URL**: `postgresql://postgres:[YOUR_DB_PASSWORD]@db.jfjvqylmjzprnztbfhpa.supabase.co:5432/postgres`

---

## 🌐 API Endpoints

### Primary Endpoints
- **REST API**: `https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/`
- **Realtime**: `wss://jfjvqylmjzprnztbfhpa.supabase.co/realtime/v1/websocket`
- **Auth**: `https://jfjvqylmjzprnztbfhpa.supabase.co/auth/v1/`
- **Storage**: `https://jfjvqylmjzprnztbfhpa.supabase.co/storage/v1/`

### Edge Functions
- **Customer Management**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/customer-management`
- **Product Search**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/product-search`
- **Order Creation**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/create-order`
- **Store Finder**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/franchisee-inventory`

---

## 🔐 API Keys

### Anonymous Key (Public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ
```

**Usage**: Client-side applications, public API access  
**Permissions**: Read access to public data, create accounts, place orders (with RLS protection)

---

## 💻 Connection Examples

### JavaScript/TypeScript (Supabase Client)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfjvqylmjzprnztbfhpa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ'

const supabase = createClient(supabaseUrl, supabaseKey)

// Example: Get all active products
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
```

### Python (supabase-py)
```python
from supabase import create_client, Client

url = "https://jfjvqylmjzprnztbfhpa.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ"

supabase: Client = create_client(url, key)

# Example: Search products
response = supabase.table('products').select("*").eq('is_active', True).execute()
```

### REST API (curl)
```bash
# Get all products
curl 'https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/products?is_active=eq.true' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ"
```

---

## 📊 Common Queries

### Get Products with Full Details
```javascript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    product_options (*),
    product_ingredients (
      ingredients (name, is_allergen)
    ),
    product_categories (
      categories (name, type)
    )
  `)
  .eq('is_active', true)
```

### Check Store Inventory
```javascript
const { data, error } = await supabase
  .from('inventory')
  .select(`
    quantity_available,
    products (product_identifier, name, base_price)
  `)
  .eq('franchisee_id', 'store-uuid')
  .gt('quantity_available', 0)
```

### Customer Lookup with Order History
```javascript
const { data, error } = await supabase
  .from('customers')
  .select(`
    *,
    orders (
      id, order_number, total_amount, status, created_at,
      order_items (
        quantity,
        products (name),
        product_options (option_name)
      )
    )
  `)
  .eq('phone', '+15551234567')
  .single()
```

### AI-Optimized Flat Table Queries
```javascript
// Fast single-query product search for AI agents
const { data, error } = await supabase
  .from('chatbot_products_flat')
  .select('product_data')
  .textSearch('product_data', 'chocolate strawberries')
  .limit(5)
```

---

## 🤖 AI Agent Configuration

### Service Role Usage
For AI agents and edge functions, use the service role key (not shown in public docs).

```javascript
// Edge function configuration
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Rate Limiting Considerations
- **Product Search**: 30 requests/minute
- **Customer Management**: 20 requests/minute  
- **Store Finder**: 15 requests/minute
- **Order Creation**: 10 requests/minute

See [EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md) for complete API documentation.

---

## 🔒 Security Configuration

### Row Level Security (RLS)
All tables have RLS enabled. Key policies:
- **Customers**: Can only access their own data
- **Products**: Public read access for active products
- **Orders**: Private to customer and assigned franchisee
- **Service Role**: Full access for AI operations

### Authentication Options
1. **Anonymous Access**: Public browsing, limited operations
2. **User Authentication**: Full customer account access
3. **Service Role**: Administrative and AI agent operations

---

## 🗄️ Database Schema Quick Reference

### Core Tables (21 total)
- **Products & Catalog** (7): products, product_options, addons, ingredients, categories, product_ingredients, product_categories
- **Customers & Addresses** (3): customers, customer_addresses, recipient_addresses  
- **Orders** (4): orders, order_items, order_addons, order_status_history
- **Business** (3): franchisees, inventory, api_rate_limits
- **AI-Optimized** (4): chatbot_products_flat, chatbot_customers_flat, chatbot_orders_flat, chatbot_franchisees_flat

### Key Fields
- **Product Identifiers**: 4-digit integers (1000-9999)
- **Phone Numbers**: Stored with country code (+1)
- **Prices**: DECIMAL(10,2) format
- **UUIDs**: All primary keys and foreign keys

See [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) for complete schema documentation.

---

## 🚀 Quick Start Checklist

### For Web Applications
- [ ] Install Supabase client library
- [ ] Configure with project URL and anon key
- [ ] Set up authentication flow
- [ ] Implement RLS-aware queries
- [ ] Test with sample customer account

### For AI Agents
- [ ] Configure service role key (securely)
- [ ] Implement rate limiting retry logic
- [ ] Use edge function endpoints
- [ ] Test customer lookup and product search
- [ ] Implement error handling for natural language

### For Development
- [ ] Review security policies in dashboard
- [ ] Test edge functions with curl/Postman
- [ ] Monitor rate limiting and performance
- [ ] Set up local development environment
- [ ] Connect to flat tables for AI optimization

---

## 🔗 Related Documentation

- **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** - Complete database schema and relationships
- **[EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md)** - API endpoints and usage
- **[AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md)** - AI chatbot integration guide
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Security policies and rate limiting

---

**⚠️ Security Note**: Keep all API keys secure and never commit them to public repositories. The service role key provides full database access and should only be used in secure server environments. 