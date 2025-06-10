# Introductory Agent - Revised Implementation Guide

Revised approach that handles anonymous users intelligently without unnecessary API calls.

## Smart Context Gathering Strategy

### **Step 1: Determine What Information We Have**

```javascript
// Check what identifiers are available
const has_user_id = user_id && user_id !== "";
const has_phone = phone_number && phone_number !== "";
const has_email = email && email !== "";

// Determine if we should call customer-management
const should_get_customer_profile = has_user_id || has_phone || has_email;

// Set authentication status
const is_authenticated = has_user_id;
```

### **Step 2: Conditional Customer Lookup**

#### **IF WE HAVE CUSTOMER IDENTIFIERS** (userId, phone, or email):
```json
{
  "method": "POST",
  "url": "{{SUPABASE_URL}}/functions/v1/customer-management",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_ANON_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "phone": "{{phone_number}}",
    "email": "{{email}}",
    "authUserId": "{{user_id}}",
    "source": "intro-agent"
  }
}
```

**Variable Assignments:**
```javascript
// From customer-management response
customer_id = response.customer._internalId;
customer_name = response.customer.firstName || "there";
is_authenticated = response.customer.isNewAccount === false;
order_count = response.orderHistory ? response.orderHistory.length : 0;
recent_order = response.orderHistory && response.orderHistory.length > 0 
  ? response.orderHistory[0] 
  : null;
```

#### **IF ANONYMOUS** (no identifiers):
```javascript
// Set default values for anonymous users
customer_id = null;
customer_name = "there";
is_authenticated = false;
order_count = 0;
recent_order = null;
customer_profile_summary = "Anonymous user - no customer lookup needed";
```

### **Step 3: Cart Status Check (Always Required)**

This is needed for ALL users (authenticated and anonymous):

```json
{
  "method": "POST",
  "url": "{{SUPABASE_URL}}/functions/v1/cart-manager",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_ANON_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "action": "summary",
    "userId": "{{user_id}}",
    "sessionId": "{{session_id}}"
  }
}
```

**Variable Assignments:**
```javascript
// From cart-manager response
has_cart_items = response.summary.itemCount > 0;
cart_item_count = response.summary.itemCount;
cart_total = response.summary.total;
cart_items = response.summary.items;
```

## Routing Logic Implementation

### **Updated Decision Tree**

```javascript
// Determine routing based on customer context
let routing_decision = "";
let handoff_message = "";
let context_package = {};

// Prepare context package for handoff
context_package = {
  customer: {
    isAuthenticated: is_authenticated,
    name: customer_name,
    email: email || null,
    phone: phone_number || null,
    userId: user_id || null,
    customerId: customer_id || null
  },
  cart: {
    hasItems: has_cart_items,
    itemCount: cart_item_count,
    subtotal: cart_total,
    items: cart_items
  },
  orderHistory: {
    totalOrders: order_count,
    recentOrder: recent_order
  },
  session: {
    sessionId: session_id,
    isAnonymous: !is_authenticated
  }
};

// Routing logic (same as before)
if (last_message.toLowerCase().includes("order") && 
    (last_message.toLowerCase().includes("track") || 
     last_message.toLowerCase().includes("modify") ||
     last_message.toLowerCase().includes("cancel") ||
     last_message.toLowerCase().includes("status"))) {
  routing_decision = "order-management";
  handoff_message = "I understand you need help with your existing order. Let me connect you with our order management team.";
}
else if (has_cart_items || 
         last_message.toLowerCase().includes("order") ||
         last_message.toLowerCase().includes("birthday") ||
         last_message.toLowerCase().includes("anniversary") ||
         last_message.toLowerCase().includes("buy") ||
         last_message.toLowerCase().includes("purchase")) {
  routing_decision = "ordering";
  context_package.routingReason = has_cart_items 
    ? "customer has items in cart" 
    : "customer expressed ordering intent";
  handoff_message = has_cart_items 
    ? "Perfect! Let me connect you with our ordering specialist who can help you complete your purchase."
    : "Great! Let me connect you with our ordering specialist who can help you find the perfect arrangement.";
}
else {
  routing_decision = "intro-support";
  handoff_message = "I'd be happy to help you with that!";
}
```

## Greeting Generation

### **Updated Dynamic Greeting**

```javascript
let greeting = "";

// Anonymous Users (no authentication)
if (!is_authenticated) {
  if (has_cart_items) {
    greeting = `Hi there! Welcome to Edible Arrangements! I notice you have ${cart_item_count} item${cart_item_count > 1 ? 's' : ''} in your cart worth $${cart_total}. Would you like some help completing your order, or is there something else I can assist you with today?`;
  } else {
    greeting = "Hi there! Welcome to Edible Arrangements! I'm here to help you with whatever you need today. Are you looking to place an order, or do you have questions about our products?";
  }
}
// Authenticated Users (have customer profile)
else {
  if (has_cart_items) {
    greeting = `Welcome back, ${customer_name}! I notice you have ${cart_item_count} item${cart_item_count > 1 ? 's' : ''} in your cart worth $${cart_total}. Would you like some help completing your order, or is there something else I can assist you with today?`;
  } else if (recent_order && recent_order.status !== "delivered") {
    greeting = `Hello ${customer_name}! I see you recently placed order ${recent_order.orderNumber} for $${recent_order.total}. It's currently ${recent_order.status}. Are you checking on this order, or is there something new I can help you with?`;
  } else {
    greeting = `Welcome back, ${customer_name}! Great to see you again. I see you've ordered with us ${order_count} time${order_count > 1 ? 's' : ''} before - thanks for being such a valued customer! What can I help you with today?`;
  }
}
```

## User Type Scenarios

### **Scenario 1: Truly Anonymous User**
- **Input**: `sessionId` only, no userId/phone/email
- **Customer Lookup**: ❌ Skipped
- **Cart Lookup**: ✅ Required
- **Greeting**: Generic welcome
- **Routing**: Based on cart + intent

### **Scenario 2: Anonymous User with Phone**
- **Input**: `sessionId` + `phoneNumber`
- **Customer Lookup**: ✅ Call customer-management
- **Result**: May find existing customer or create new one
- **Greeting**: Personalized if customer found

### **Scenario 3: Authenticated User**
- **Input**: `userId` + optional phone/email
- **Customer Lookup**: ✅ Call customer-management
- **Result**: Full customer profile with order history
- **Greeting**: Fully personalized

### **Scenario 4: Anonymous with Cart**
- **Input**: `sessionId` only, but has items in cart
- **Customer Lookup**: ❌ Skipped
- **Cart Lookup**: ✅ Shows cart contents
- **Greeting**: "Hi there! I notice you have items in your cart..."
- **Routing**: Likely to ordering agent

## Performance Benefits

1. **Reduced API Calls**: No unnecessary customer-management calls for truly anonymous users
2. **Faster Response**: Skip database lookups when we have no identifying info
3. **Better UX**: Don't create fake customer records for anonymous browsers
4. **Cleaner Data**: Customer database only contains real customers

## Updated Variable Flow

```javascript
// Step 1: Check available identifiers
should_get_customer_profile = has_user_id || has_phone || has_email;

// Step 2: Conditional customer lookup
if (should_get_customer_profile) {
  // Call customer-management API
  // Set customer variables from response
} else {
  // Set anonymous defaults
  customer_id = null;
  customer_name = "there";
  is_authenticated = false;
  order_count = 0;
  recent_order = null;
}

// Step 3: Always check cart (for both anonymous and authenticated)
// Call cart-manager API
// Set cart variables from response

// Step 4: Generate greeting and routing decision
// Use all gathered information
```

This approach is much more efficient and realistic - we only look up customer information when we actually have something to look up! 