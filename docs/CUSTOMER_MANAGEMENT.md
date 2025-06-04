# Customer Management System

Complete guide to the unified customer account system for the Edible Arrangements Voiceflow integration.

## System Overview

The customer management system provides unified account handling across multiple platforms (chatbot, web app, phone orders) with automatic duplicate detection and account merging capabilities.

### Key Features
- **Multi-source Account Tracking**: Chatbot, web app, and phone order integration
- **Automatic Duplicate Prevention**: Smart detection and merging of duplicate accounts
- **Unified Order History**: Complete order tracking across all platforms
- **Allergy & Preference Management**: Safety-focused customer data handling

## API Reference

**Endpoint**: `POST /functions/v1/customer-management`  
**Rate Limit**: 20 requests per minute

### Request Format
```json
{
  "phone": "+1234567890",               // Primary identifier for voice/chatbot
  "email": "customer@email.com",        // Primary identifier for web app
  "authUserId": "auth-uuid",            // Web app authentication linking
  "firstName": "John",
  "lastName": "Smith",
  "allergies": ["nuts", "dairy"],       // For safety warnings
  "dietary_restrictions": ["vegetarian"],
  "source": "chatbot"                   // chatbot, webapp, phone
}
```

### Response Format
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
      "accountSources": ["chatbot", "webapp"],
      "createdVia": "chatbot",
      "lastUpdatedVia": "webapp"
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

## Account Unification Logic

### Detection Strategy
The system searches for existing accounts using multiple identifiers:

1. **Phone Number**: Primary identifier for voice-based interactions
2. **Email Address**: Primary identifier for web applications  
3. **Auth User ID**: Links to Supabase authentication system

### Merge Logic
When multiple identifiers are provided:

| Scenario | System Action | Result |
|----------|---------------|--------|
| No existing account | Create new account | Single unified account created |
| One match found | Update existing account | Information merged and enhanced |
| Multiple partial matches | Merge compatible accounts | Unified account with complete data |
| Conflicting data | Flag for manual resolution | Conflict reported for handling |

### Data Precedence Rules
When merging accounts with conflicting information:

1. **Contact Information**: Most recent and complete data wins
2. **Allergies**: Union of all reported allergies (safety-first approach)
3. **Order History**: Complete preservation across all accounts
4. **Authentication**: Web app auth takes precedence for login

## Integration Scenarios

### Chatbot-First Customer Journey
```javascript
// Step 1: Initial chatbot interaction
const response = await fetch('/functions/v1/customer-management', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceRoleKey}`
  },
  body: JSON.stringify({
    phone: "+1234567890",
    firstName: "Alice",
    source: "chatbot"
  })
});

// Step 2: Customer later uses web app
const webResponse = await fetch('/functions/v1/customer-management', {
  method: 'POST',
  body: JSON.stringify({
    email: "alice@email.com",
    phone: "+1234567890",  // Links to existing chatbot account
    authUserId: "auth-uuid",
    source: "webapp"
  })
});
// Result: Existing account enhanced with web app credentials
```

### Web-App-First Customer Journey
```javascript
// Step 1: Web app registration
const webUser = await fetch('/functions/v1/customer-management', {
  method: 'POST',
  body: JSON.stringify({
    email: "bob@email.com",
    authUserId: "auth-uuid",
    firstName: "Bob",
    lastName: "Wilson",
    source: "webapp"
  })
});

// Step 2: Customer calls chatbot
const chatbotCall = await fetch('/functions/v1/customer-management', {
  method: 'POST',
  body: JSON.stringify({
    phone: "+1987654321",
    email: "bob@email.com",  // Links to existing web account
    source: "chatbot"
  })
});
// Result: Web account enhanced with phone number for voice access
```

## Customer Data Management

### Allergy and Safety Handling
```json
{
  "allergies": ["nuts", "dairy", "shellfish"],
  "dietary_restrictions": ["vegetarian", "gluten-free"],
  "preferences": {
    "notificationMethod": "email",
    "defaultDeliveryInstructions": "Leave at front door"
  }
}
```

The system:
- Automatically warns about allergens during product searches
- Maintains comprehensive allergy history across all interactions
- Uses union approach when merging allergy data (includes all reported allergies)

### Order History Preservation
```json
{
  "orderHistory": [
    {
      "orderNumber": "W25710000001-1",
      "date": "2025-01-15T14:30:00Z",
      "total": "54.11",
      "status": "delivered",
      "itemsSummary": "Chocolate Strawberries (Large), Greeting Card",
      "platform": "chatbot"
    },
    {
      "orderNumber": "W25710000002-1", 
      "date": "2025-01-10T16:45:00Z",
      "total": "78.25",
      "status": "delivered",
      "itemsSummary": "Fruit Arrangement (Premium)",
      "platform": "webapp"
    }
  ]
}
```

Complete order history is maintained regardless of which platform was used for ordering.

## Database Schema

### Customer Table Structure
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  allergies TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  last_order_at TIMESTAMP,
  auth_user_id UUID REFERENCES auth.users(id)
);
```

### Preferences JSON Structure
```json
{
  "accountSources": ["chatbot", "webapp", "phone"],
  "createdVia": "chatbot",
  "lastUpdatedVia": "webapp",
  "mergeHistory": [
    {
      "date": "2025-01-15T10:00:00Z",
      "action": "account_linked",
      "sourceAccount": "chatbot_account_uuid",
      "targetAccount": "webapp_account_uuid"
    }
  ],
  "communicationPreferences": {
    "orderConfirmations": "email",
    "marketingUpdates": "none",
    "deliveryNotifications": "sms"
  }
}
```

## Error Handling

### Validation Errors
```json
{
  "error": "validation_failed",
  "message": "Phone number format invalid",
  "details": {
    "field": "phone",
    "provided": "1234567890",
    "expected": "+1234567890 (E.164 format)"
  }
}
```

### Conflict Resolution
```json
{
  "error": "account_conflict",
  "message": "Multiple accounts found with conflicting information",
  "conflicts": [
    {
      "field": "name",
      "account1": {"firstName": "John", "lastName": "Smith"},
      "account2": {"firstName": "Johnny", "lastName": "Smith"}
    }
  ],
  "suggestedActions": [
    "Use most recent name information",
    "Manual verification required"
  ]
}
```

## Best Practices

### For Chatbot Integration
1. **Always provide source tracking**: Include `"source": "chatbot"` in requests
2. **Use phone as primary identifier**: Most reliable for voice interactions
3. **Collect email when possible**: Enables account linking with web app
4. **Handle conflicts gracefully**: Have fallback flows for account conflicts

### For Web App Integration
1. **Link authentication properly**: Always include `authUserId` when available
2. **Preserve existing data**: Don't overwrite chatbot-collected information
3. **Maintain session context**: Use returned customer ID for order management
4. **Support account discovery**: Allow customers to find existing accounts

### For Phone Order Integration
1. **Verify customer identity**: Use multiple identifiers when possible
2. **Update contact information**: Keep phone and email current
3. **Document interaction source**: Mark as phone order in source tracking
4. **Maintain order attribution**: Properly link orders to customer accounts

## Security & Privacy

### Data Protection
- All customer data protected by Row Level Security (RLS)
- Sensitive information encrypted at rest
- Access logs maintained for audit trails
- GDPR-compliant data handling

### Access Control
- Customers can only access their own data
- Service role provides full access for system operations
- Authentication required for web app features
- Anonymous access limited to account creation only

This unified customer management system ensures consistent, secure, and efficient customer account handling across all platforms while maintaining data integrity and providing excellent customer experience. 