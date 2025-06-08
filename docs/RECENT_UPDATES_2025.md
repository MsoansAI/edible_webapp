# Recent Updates & Bug Fixes - January 2025

## Overview
This document summarizes the major improvements, bug fixes, and enhancements made to the Edible Arrangements voice bot backend system in January 2025.

---

## 🔧 Order Endpoint Fixes (Version 23)

### Critical Bug Fixes
- **UUID Variable Resolution**: Fixed bug where code used `customerId`/`franchiseeId` instead of resolved UUIDs
- **Voice-Friendly Option Resolution**: Fixed proper resolution of option names (e.g., "Large") to UUIDs
- **String-to-Number Conversion**: Enhanced handling of string numbers for store numbers and product IDs
- **Schema Compliance**: Removed references to non-existent database fields (`gift_message`, `pickup_time`)

### Order Number Generation Fixed
**Before (Broken):**
- `W25710000001-1` (store 257 + sequence incorrectly concatenated)

**After (Fixed):**
- Store 257: `W25700000001-1`, `W25700000002-1`, `W25700000003-1`
- Store 101: `W10100000001-1`, `W10100000002-1`, `W10100000003-1`

**Key Improvements:**
- Proper store-specific sequence numbering
- Fixed regex parsing: `W${storeNumber}(\\d{8})-1`
- Sequences increment correctly within each store
- Easy store identification from order number

### Authentication Requirements Clarified
- **Service Role Key Required**: Order endpoint requires Supabase service role key
- **Not Anonymous Key**: Cannot use anon key for order creation
- **Postman Testing**: Must use `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

---

## 👤 Customer Management Enhancements (Version 7)

### Enhanced Profile Fields
Added comprehensive customer profile tracking:

```json
{
  "preferredContactMethod": "phone",     // phone, email, text
  "preferredDeliveryTime": "afternoon",  // morning, afternoon, evening
  "birthday": "1985-06-15",             // YYYY-MM-DD format
  "anniversary": "2010-08-20",          // YYYY-MM-DD format
  "occupation": "teacher",
  "householdSize": 4,
  "specialOccasions": ["birthdays", "holidays"],
  
  // Communication Preferences
  "orderReminders": true,               // Order status notifications
  "promotionalOffers": false,           // Marketing communications
  "holidaySpecials": true               // Holiday promotion alerts
}
```

### Critical Bug Fixes
- **Email Update Logic**: Fixed contradictory logic that prevented updating temporary emails
  - Before: "If email is NOT temporary, only update if it IS temporary" (impossible)
  - After: Properly updates email if current is temporary OR no email exists
- **Preferences Handling**: Improved update detection for preference changes
- **Source Tracking**: Better handling of multi-source account updates

### Response Enhancements
- Added `name` convenience field (full name)
- Enhanced `preferences` object with detailed profile information
- Quick access `accountSources` array
- Improved welcome messages based on order history

---

## 🔍 Debug & Monitoring Improvements

### Enhanced Logging
- Added comprehensive debug logging to order endpoint
- Request data logging for troubleshooting
- Resolution results tracking (customer/store/product lookups)
- Validation failure details

### Error Handling
- More descriptive error messages for voice bots
- Specific validation failure feedback
- Available options suggestions for invalid inputs
- Clear authentication requirement messaging

---

## 🎯 Voice Bot Optimizations

### String Handling Robustness
- **Store Numbers**: Handles both `"257"` and `257`
- **Product IDs**: Handles both `"3075"` and `3075`
- **Consistent Parsing**: Uses `parseInt(String(value), 10)` throughout

### Option Name Resolution
- Proper mapping from voice-friendly names ("Large") to database UUIDs
- Enhanced error messages when options don't exist
- Suggestions for valid alternatives

### Backward Compatibility
- All enhancements maintain UUID support for web applications
- Legacy API formats continue to work
- Gradual migration path for existing integrations

---

## 📋 Database Schema Fixes

### Removed Invalid Fields
- `gift_message` - Not in actual orders table schema
- `pickup_time` - Using existing `pickup_customer_name` field
- `delivery_*` fields - Using `recipient_addresses` table relationship

### Proper Field Usage
- `special_instructions` - For both gift messages and special instructions
- `recipient_address_id` - For delivery address relationships
- `pickup_customer_name` - For pickup information

---

## 🚀 Performance Improvements

### Database Query Optimizations
- Store-specific order number queries using `LIKE` patterns
- Efficient customer lookup by phone number
- Proper indexing usage for voice-friendly identifiers

### Reduced API Calls
- Single customer resolution per order
- Batch validation for order items
- Efficient option name to UUID mapping

---

## 📋 Version Summary

| Component | Version | Key Changes |
|---|---|---|
| **Order Endpoint** | v23 | Fixed UUID resolution, order numbering, schema compliance |
| **Customer Management** | v7 | Enhanced profiles, fixed email logic, improved preferences |
| **Documentation** | Updated | Comprehensive bug fix documentation, examples updated |

---

## 🔄 Migration Notes

### For Developers
- Update Postman collections to use service role key for order endpoint
- Test order number generation with new format
- Verify customer profile field handling

### For Voice Bot Integration
- Option names should work seamlessly with existing voice flows
- Store numbers and phone numbers continue to work as before
- Enhanced error messages provide better user feedback

### For Database
- No schema migrations required - all fixes are code-level
- Existing data remains intact
- Order numbering starts fresh with correct format

---

## 🔍 Testing Checklist

### Order Endpoint
- [ ] Customer phone number resolution
- [ ] Store number resolution (both string and number)
- [ ] Product ID resolution (4-digit and UUID)
- [ ] Option name resolution ("Large", "Small", etc.)
- [ ] Order number generation format
- [ ] Service role key authentication

### Customer Management
- [ ] Enhanced profile field capture
- [ ] Email update from temporary to real
- [ ] Preferences handling and updates
- [ ] Multi-source account tracking

### General
- [ ] Error message clarity
- [ ] Debug logging functionality
- [ ] Backward compatibility with UUIDs
- [ ] Voice-friendly identifier handling

---

*Last Updated: January 18, 2025*
*System Version: Order v23, Customer Management v7* 