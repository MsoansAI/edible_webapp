# Edible Arrangements Voiceflow Integration

A complete backend system for an Edible Arrangements chatbot built with Voiceflow, featuring AI-powered product search, advanced order management, and customer account handling.

## 🏗️ Architecture Overview

This system consists of:
- **Supabase PostgreSQL Database**: Normalized schema with performance-optimized flat tables
- **Edge Functions**: Serverless API endpoints for chatbot integration 
- **AI Integration**: OpenAI embeddings for semantic product search
- **Voiceflow Integration**: RESTful APIs optimized for conversational interfaces

## 📁 Project Structure

```
├── docs/                          # Comprehensive documentation
│   ├── SYSTEM_OVERVIEW.md         # Complete system diagrams and architecture
│   ├── ARCHITECTURE.md            # System architecture overview
│   ├── DATABASE_STRUCTURE.md      # Database schema documentation
│   ├── EDGE_FUNCTIONS_GUIDE.md    # API endpoint documentation
│   ├── SUPABASE_SETUP.md          # Setup and deployment guide
│   ├── CUSTOMER_MANAGEMENT.md     # Customer account system docs
│   ├── SECURITY_GUIDE.md          # Security and rate limiting
│   └── AI_AGENT_INTEGRATION.md    # AI agent configuration
├── supabase/                      # Supabase configuration
│   └── functions/                 # Edge function source code
├── voiceflow/                     # Voiceflow integration examples
│   ├── README.md                  # Integration guide
│   └── api-examples.js            # Reusable API code snippets
├── tests/                         # Test files (if any)
├── scripts/                       # Utility scripts (if any)
└── package.json                   # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites
- Supabase account with project setup
- OpenAI API key for semantic search
- Node.js for any local development

### Environment Variables
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup
1. Follow `docs/SUPABASE_SETUP.md` for complete database initialization
2. Import the schema and initial data
3. Configure Row Level Security (RLS) policies

### Edge Functions Deployment
All edge functions are deployed and active:
- `product-search` (v14) - AI-powered product search
- `customer-management` (v4) - Customer account handling  
- `franchisee-inventory` (v8) - Store location services
- `order` (v16) - Complete order management
- `order-items` (v9) - Advanced order item manipulation
- `generate-embedding` (v5) - AI embedding generation

## 🎯 Core Features

### AI-Powered Product Search
- **Level 1**: Direct 4-digit product ID lookup
- **Level 2**: Structured database search with filters
- **Level 3**: Semantic search using OpenAI embeddings
- Price range filtering, allergen awareness, inventory checking

### Advanced Order Management
- Smart item addition (prevents duplicates)
- Partial quantity removal support
- Cancellation prevention with live agent redirect
- Real-time price calculations with tax
- Support for delivery and pickup orders

### Customer Account System
- Multi-source account unification (chatbot, web, phone)
- Duplicate detection and prevention
- Allergy and preference management
- Order history tracking

### Store Management
- ZIP code-based store finding
- Real-time inventory checking
- Operating hours management
- Delivery zone validation

## 🔧 API Endpoints

### Product Search
```http
POST /functions/v1/product-search
Content-Type: application/json

{
  "query": "birthday arrangement",
  "priceRange": "mid",
  "allergens": ["nuts"],
  "franchiseeId": "store-uuid"
}
```

### Order Management
```http
POST /functions/v1/order
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "franchiseeId": "store-uuid", 
  "items": [
    {
      "productId": "3075",
      "quantity": 1,
      "optionName": "Large"
    }
  ],
  "deliveryAddress": { ... }
}
```

### Order Item Modification
```http
PATCH /functions/v1/order-items
Content-Type: application/json

{
  "orderNumber": "W25710000001-1",
  "items": [
    {
      "action": "add",
      "productId": "3075", 
      "optionName": "Large",
      "quantity": 2
    }
  ]
}
```

## 📊 Business Logic

### Order Numbers
Format: `W[store_number][sequence]-1`
- Example: `W25710000001-1`
- Designed for phone conversations and easy reference

### Pricing
- Base product price + option price
- 8.25% tax rate
- Precise decimal calculations
- Real-time total updates

### Customer-Friendly Design
- 4-digit product IDs for voice communication
- Human-readable option names ("Large", "Birthday")
- Conversational error messages
- Streamlined API responses for chatbots

## 🔒 Security & Performance

### Rate Limiting
- IP-based rate limiting per endpoint
- Different limits for different operation types
- Automatic cleanup of expired limits

### Data Security
- Row Level Security (RLS) on all tables
- Input validation and sanitization
- Service-role authentication for edge functions

### Performance Optimization
- Flat table architecture for fast queries
- Vector indexing for semantic search
- Minimal API response sizes
- Efficient database triggers

## 📖 Documentation

For detailed information, see the `/docs` directory:

- **[SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md)** - Complete system diagrams and data flow
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete system architecture
- **[DATABASE_STRUCTURE.md](docs/DATABASE_STRUCTURE.md)** - Database schema and relationships
- **[EDGE_FUNCTIONS_GUIDE.md](docs/EDGE_FUNCTIONS_GUIDE.md)** - API endpoint documentation
- **[CUSTOMER_MANAGEMENT.md](docs/CUSTOMER_MANAGEMENT.md)** - Account system details
- **[SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md)** - Security implementation

## 🛠️ Development

This system is production-ready and actively serves a Voiceflow chatbot. All edge functions are deployed and maintained through the Supabase dashboard.

For local development or testing:
1. Clone this repository
2. Set up environment variables
3. Follow the setup guide in `docs/SUPABASE_SETUP.md`

## 🎤 Voiceflow Integration

The system is optimized for Voiceflow chatbots with:
- Conversational API responses
- Error handling with user-friendly messages
- Support for voice-based product identification
- Cancellation prevention with live agent handoff

See `/voiceflow` directory for integration examples and reusable code snippets.

## 📞 Support

This system includes built-in support for:
- Live agent handoff for complex scenarios
- Comprehensive error logging
- Rate limiting protection
- Data integrity validation

---

**Status**: Production Ready ✅  
**Last Updated**: January 2025  
**Edge Functions**: 6 active, all current versions deployed