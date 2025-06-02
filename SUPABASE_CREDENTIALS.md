# Supabase Project Credentials

## 🔑 **Connection Details**

**Project ID**: `jfjvqylmjzprnztbfhpa`  
**Project Name**: `edible-arrangements-mvp`  
**Organization**: MsoansAI's Org  
**Region**: us-east-1  
**Monthly Cost**: $10

---

## 🌐 **API Endpoints**

**Project URL**: `https://jfjvqylmjzprnztbfhpa.supabase.co`  
**API URL**: `https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/`  
**Database URL**: `postgresql://postgres:[YOUR_DB_PASSWORD]@db.jfjvqylmjzprnztbfhpa.supabase.co:5432/postgres`

---

## 🔐 **API Keys**

**Anonymous Key** (Public):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ
```

---

## 💻 **Usage Examples**

### JavaScript/TypeScript (Supabase Client)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfjvqylmjzprnztbfhpa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ'
const supabase = createClient(supabaseUrl, supabaseKey)
```

### REST API
```bash
curl 'https://jfjvqylmjzprnztbfhpa.supabase.co/rest/v1/products' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ"
```

---

## 📊 **Sample Queries**

### Get All Products with Options
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
```

### Check Inventory at Store
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

### Get Customer with Allergies
```javascript
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('email', 'customer@example.com')
```

---

## 🚀 **Next Steps**

1. **Set up authentication**: Configure RLS policies
2. **Create Edge Functions**: Build AI chatbot query endpoints
3. **Populate flat tables**: Set up data sync triggers
4. **Connect to Voiceflow**: Integrate AI assistant
5. **Build web app**: Create customer-facing interface

---

*Keep these credentials secure and never commit them to public repositories.* 