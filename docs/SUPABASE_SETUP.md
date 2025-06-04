# 🔧 Supabase Setup & Configuration

Complete setup guide for the Edible Arrangements Voiceflow integration backend.

## 🔑 Project Information

**Project ID**: `jfjvqylmjzprnztbfhpa`  
**Project Name**: `edible-arrangements`  
**Organization**: Production Environment  
**Region**: us-east-1  

**Project URL**: `https://jfjvqylmjzprnztbfhpa.supabase.co`  
**Database URL**: `postgresql://postgres:[YOUR_DB_PASSWORD]@db.jfjvqylmjzprnztbfhpa.supabase.co:5432/postgres`

## 🌐 API Endpoints

### Core Services
- **REST API**: `https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/`
- **Realtime**: `wss://jfjvqylmjzprnztbfhpa.supabase.co/realtime/v1/websocket`
- **Auth**: `https://jfjvqylmjzprnztbfhpa.supabase.co/auth/v1/`
- **Storage**: `https://jfjvqylmjzprnztbfhpa.supabase.co/storage/v1/`

### Edge Functions (Production)
- **Product Search**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/product-search`
- **Customer Management**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/customer-management`
- **Store Finder**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/franchisee-inventory`
- **Order Management**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/order`
- **Order Items**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/order-items`
- **AI Embeddings**: `https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/generate-embedding`

## 🔐 API Keys

### Anonymous Key (Public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ
```

**Usage**: Client-side applications, public API access  
**Permissions**: Read access to public data, create accounts, place orders (with RLS protection)

## 💻 Connection Examples

### JavaScript/TypeScript
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Example: Search products
const { data: products, error } = await supabase
  .from('products')
  .select(`
    *,
    product_options(*),
    product_categories(categories(*))
  `)
  .eq('is_active', true)
```

### Python
```python
import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

// Example: Get customer data
response = supabase.table('customers').select("*").eq('phone', '+1234567890').execute()
```

### REST API (curl)
```bash
# Get active products
curl 'https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/products?is_active=eq.true' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

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
// Single query for chatbot responses
const { data } = await supabase
  .from('chatbot_products_flat')
  .select('product_data')
  .textSearch('product_data', 'chocolate birthday')
  .limit(5)

// Customer context for AI agents
const { data } = await supabase
  .from('chatbot_customers_flat')
  .select('customer_data')
  .eq('customer_id', 'uuid')
  .single()
```

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

## 🔗 Related Documentation

- **[DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)** - Complete database schema and relationships
- **[EDGE_FUNCTIONS_GUIDE.md](EDGE_FUNCTIONS_GUIDE.md)** - API endpoints and usage
- **[AI_AGENT_INTEGRATION.md](AI_AGENT_INTEGRATION.md)** - AI chatbot integration guide
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Security policies and rate limiting

## 📋 Environment Variables

```bash
# Required for all integrations
SUPABASE_URL=https://jfjvqylmjzprnztbfhpa.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for AI features
OPENAI_API_KEY=your_openai_api_key_here
```

## 📋 Edge Function Development

### Local Development Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Start local development
supabase start

# Deploy function
supabase functions deploy function-name
```

### Edge Function Template
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
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

  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
    
    return new Response(
      JSON.stringify({ data, error }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

## 📋 Security Configuration

### Row Level Security Policies
All tables have RLS enabled with these access patterns:

#### Customer Data
```sql
-- Customers can only access their own data
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Service role has full access
CREATE POLICY "Service role full access" ON customers
  FOR ALL USING (current_user = 'service_role');
```

#### Product Data
```sql
-- Public read access for active products
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true);
```

#### Order Data
```sql
-- Customers can only access their own orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );
```

### API Rate Limiting
Rate limits are enforced at the edge function level:

- **product-search**: 30 requests/minute
- **customer-management**: 20 requests/minute
- **franchisee-inventory**: 15 requests/minute
- **order**: 20 requests/minute
- **order-items**: 15 requests/minute
- **generate-embedding**: 10 requests/minute

## 📋 Monitoring & Debugging

### Query Performance
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Monitor flat table sync
SELECT 
  schemaname, 
  tablename, 
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename LIKE 'chatbot_%_flat';
```

### Edge Function Logs
Access logs through the Supabase dashboard under Functions > Logs, or use CLI:

```bash
supabase functions logs --follow
```

## 📋 Backup & Recovery

### Automated Backups
- Daily automated backups enabled
- Point-in-time recovery available
- Cross-region backup replication configured

### Manual Backup
```bash
# Export schema
pg_dump -h db.jfjvqylmjzprnztbfhpa.supabase.co \
        -U postgres \
        -d postgres \
        --schema-only > schema.sql

# Export data
pg_dump -h db.jfjvqylmjzprnztbfhpa.supabase.co \
        -U postgres \
        -d postgres \
        --data-only > data.sql
```

## 📋 Integration Testing

### Edge Function Testing
```javascript
// Test product search
const response = await fetch('https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/product-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    query: "chocolate strawberries",
    priceRange: "mid"
  })
})

const data = await response.json()
console.log(data)
```

### Database Health Check
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check extension status
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name IN ('vector', 'uuid-ossp', 'postgis');
```

This setup provides a complete, production-ready backend for the Edible Arrangements Voiceflow integration with robust security, performance optimization, and monitoring capabilities.

**⚠️ Security Note**: Keep all API keys secure and never commit them to public repositories. The service role key provides full database access and should only be used in secure server environments. 