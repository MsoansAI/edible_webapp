# Introductory Agent - Voiceflow Implementation Guide

Technical implementation details for the customer triage and routing system.

## Voiceflow Flow Structure

### Flow Architecture
```
[Start Block] 
    ↓
[Context Gathering] 
    ↓
[Customer Assessment] 
    ↓
[Routing Decision] 
    ↓
[Agent Handoff]
```

## Context Gathering Implementation

### 1. Initial Context Check - API Step

**API Configuration:**
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

### 2. Cart Status Check - API Step

**API Configuration:**
```json
{
  "method": "POST",
  "url": "{{SUPABASE_URL}}/functions/v1/cart-manager",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_ANON_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "action": "get_current_cart",
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

### Decision Tree Code Block

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
    email: email,
    phone: phone_number,
    userId: user_id,
    customerId: customer_id
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
  }
};

// Check for explicit order management intent
if (last_message.toLowerCase().includes("order") && 
    (last_message.toLowerCase().includes("track") || 
     last_message.toLowerCase().includes("modify") ||
     last_message.toLowerCase().includes("cancel") ||
     last_message.toLowerCase().includes("status"))) {
  routing_decision = "order-management";
  handoff_message = "I understand you need help with your existing order. Let me connect you with our order management team who can access your order details and make any necessary changes.";
}
// Check for ordering intent (has cart or wants to order)
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
// Stay with intro agent for general questions
else {
  routing_decision = "intro-support";
  handoff_message = "I'd be happy to help you with that!";
}
```

## Greeting Generation

### Dynamic Greeting Code Block

```javascript
let greeting = "";

// First-time/Anonymous Customer
if (!is_authenticated || order_count === 0) {
  if (has_cart_items) {
    greeting = `Hi there! Welcome to Edible Arrangements! I notice you have ${cart_item_count} item${cart_item_count > 1 ? 's' : ''} in your cart worth $${cart_total}. Would you like some help completing your order, or is there something else I can assist you with today?`;
  } else {
    greeting = "Hi there! Welcome to Edible Arrangements! I'm here to help you with whatever you need today. Are you looking to place an order, or do you have questions about our products?";
  }
}
// Returning Customer
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

## Agent Handoff Implementation

### Conditional Paths Based on Routing Decision

#### Path 1: Route to Ordering Agent
**Condition**: `routing_decision === "ordering"`
**Action**: Go to Ordering Agent Flow
**Context Variables to Pass**:
```json
{
  "handoff_context": "{{context_package}}",
  "routing_reason": "{{routing_reason}}",
  "customer_intent": "ordering",
  "has_cart_items": "{{has_cart_items}}",
  "customer_name": "{{customer_name}}",
  "customer_id": "{{customer_id}}"
}
```

#### Path 2: Route to Order Management Agent
**Condition**: `routing_decision === "order-management"`
**Action**: Go to Order Management Flow
**Context Variables to Pass**:
```json
{
  "handoff_context": "{{context_package}}",
  "routing_reason": "order_management",
  "customer_intent": "order_management",
  "recent_order": "{{recent_order}}",
  "customer_name": "{{customer_name}}",
  "customer_id": "{{customer_id}}"
}
```

#### Path 3: Stay with Intro Agent (Support)
**Condition**: `routing_decision === "intro-support"`
**Action**: Continue in current flow with support capabilities

## Support Capabilities (When Staying with Intro Agent)

### General Product Information - API Step
```json
{
  "method": "POST",
  "url": "{{SUPABASE_URL}}/functions/v1/product-search",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_ANON_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "query": "{{last_message}}",
    "limit": 3,
    "informationOnly": true
  }
}
```

### Store Location Finder - API Step
```json
{
  "method": "GET",
  "url": "{{SUPABASE_URL}}/functions/v1/franchisee-inventory/find-nearest?zipCode={{zip_code}}",
  "headers": {
    "Authorization": "Bearer {{SUPABASE_ANON_KEY}}"
  }
}
```

## Error Handling

### Context Gathering Failure
```javascript
// If customer-management API fails
if (!response || response.error) {
  // Set fallback values
  customer_name = "there";
  is_authenticated = false;
  order_count = 0;
  has_cart_items = false;
  
  // Use generic greeting
  greeting = "Hi there! Welcome to Edible Arrangements! I'm here to help you with whatever you need today. How can I assist you?";
}
```

### Intent Classification Uncertainty
```javascript
// If routing decision is unclear
if (routing_decision === "" || routing_decision === undefined) {
  // Ask clarifying question
  clarification_message = "I want to make sure I get you to the right person to help. Could you tell me a bit more about what you're looking to do today? Are you:\n• Looking to place a new order\n• Checking on an existing order\n• Just browsing or have general questions";
  
  // Set flag to wait for clarification
  needs_clarification = true;
}
```

## Variable Definitions for Voiceflow

### Input Variables (from session/user)
- `user_id`: Authenticated user ID
- `session_id`: Anonymous session identifier  
- `phone_number`: Customer phone (if provided)
- `email`: Customer email (if provided)
- `last_message`: Customer's initial message
- `zip_code`: Customer location (if available)

### Output Variables (set by intro agent)
- `routing_decision`: Which agent to route to
- `handoff_message`: Message to display during handoff
- `context_package`: Full customer context for handoff
- `customer_name`: Customer's name for personalization
- `customer_id`: Internal customer ID
- `is_authenticated`: Authentication status
- `has_cart_items`: Whether customer has items in cart
- `cart_item_count`: Number of items in cart
- `cart_total`: Total cart value
- `order_count`: Number of previous orders
- `recent_order`: Most recent order details

## Integration with Existing Agents

### Handoff to Original Ordering Agent
The intro agent can seamlessly pass context to your existing ordering agent by setting these variables:
```json
{
  "order_details": {
    "order_card": "{{context_package}}"
  },
  "isAuthenticated": "{{is_authenticated}}",
  "customerAllergies": "{{allergies}}",
  "store_id": "{{selected_store_id}}",
  "customer_context": "{{customer_name}} - {{routing_reason}}"
}
```

### Performance Monitoring

#### Key Metrics to Track
```javascript
// Track routing decisions
routing_analytics = {
  timestamp: new Date().toISOString(),
  customer_type: is_authenticated ? "returning" : "new",
  routing_decision: routing_decision,
  has_cart: has_cart_items,
  cart_value: cart_total,
  response_time: context_gathering_time,
  session_id: session_id
};
```

This implementation provides a sophisticated customer triage system that intelligently routes customers while maintaining context and providing smooth handoffs between specialized agents. 