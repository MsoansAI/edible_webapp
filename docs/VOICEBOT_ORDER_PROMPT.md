# Voicebot Order Creation Prompt

## Task
Convert the customer's order request into a valid JSON object for order creation. Return ONLY the JSON object with no additional text, comments, or formatting.

## Customer & Store Identification

### Customer Identification (REQUIRED)
- `customerPhone`: E164 formatted phone number (e.g., "+14155551234")  
- `customerId`: UUID (if available) - takes precedence over phone

For new customers, use phone number. The system will create a customer record if needed.

### Store Identification (REQUIRED)  
- `storeNumber`: Integer store number (e.g., 101, 202)
- `franchiseeId`: UUID (if available) - takes precedence over store number

Use store number for voice-friendly identification.

## Order Items (REQUIRED)

### Basic Item Structure
```json
{
  "productId": "3075",
  "quantity": 2
}
```

### Item with Size/Option
```json
{
  "productId": "3075", 
  "productOptionId": "Large",
  "quantity": 1
}
```

### Item with Add-ons
```json
{
  "productId": "3075",
  "quantity": 1,
  "addons": [
    {
      "addonId": "extra-chocolate",
      "quantity": 1
    }
  ]
}
```

**Important Notes:**
- `productId`: Use 4-digit product IDs (e.g., "3075") or UUIDs
- `productOptionId`: Use option names (e.g., "Large", "Small", "Medium") or UUIDs  
- `addonId`: Use addon names or UUIDs
- Always include `quantity` for each item

## Fulfillment Type

### Pickup Orders (No deliveryAddress)
```json
{
  "customerPhone": "+14155551234",
  "storeNumber": 101,
  "items": [...],
  "scheduledDate": "2024-01-15",
  "scheduledTimeSlot": "2:00 PM"
}
```

### Delivery Orders (Include deliveryAddress)
```json
{
  "customerPhone": "+14155551234", 
  "storeNumber": 101,
  "items": [...],
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "San Francisco", 
    "state": "CA",
    "zipCode": "94105",
    "recipientName": "John Doe",
    "recipientPhone": "+14155551234",
    "specialInstructions": "Ring doorbell twice"
  },
  "scheduledDate": "2024-01-15",
  "scheduledTimeSlot": "2:00 PM - 4:00 PM"
}
```

## Delivery Address Fields

### Required for Delivery
- `street`: Full street address
- `city`: City name
- `state`: State abbreviation (e.g., "CA", "NY")
- `zipCode`: ZIP code

### Optional for Delivery
- `recipientName`: Name of recipient (defaults to customer name)
- `recipientPhone`: Recipient phone (defaults to customer phone)
- `specialInstructions`: Delivery instructions

## Scheduling (REQUIRED)

### Date
- `scheduledDate`: Date in YYYY-MM-DD format (e.g., "2024-01-15")
- If not specified, defaults to next business day

### Time Slots
- `scheduledTimeSlot`: Time range or specific time

**Pickup Examples:**
- "10:00 AM"
- "2:30 PM" 
- "5:00 PM"

**Delivery Examples:**
- "9:00 AM - 11:00 AM"
- "12:00 PM - 2:00 PM"
- "2:00 PM - 4:00 PM"
- "4:00 PM - 6:00 PM"

## Optional Fields

- `specialInstructions`: General order notes
- `giftMessage`: Message for gift orders
- `outputType`: Response format ("streamlined" or "json")

## Complete Examples

### Simple Pickup Order
```json
{
  "customerPhone": "+14155551234",
  "storeNumber": 101, 
  "items": [
    {
      "productId": "3075",
      "quantity": 1
    }
  ],
  "scheduledDate": "2024-01-15",
  "scheduledTimeSlot": "2:00 PM"
}
```

### Delivery Order with Options
```json
{
  "customerPhone": "+14155551234",
  "storeNumber": 101,
  "items": [
    {
      "productId": "3075",
      "productOptionId": "Large", 
      "quantity": 2
    },
    {
      "productId": "3076",
      "quantity": 1,
      "addons": [
        {
          "addonId": "extra-chocolate",
          "quantity": 1
        }
      ]
    }
  ],
  "deliveryAddress": {
    "street": "456 Oak Avenue",
    "city": "San Francisco",
    "state": "CA", 
    "zipCode": "94102",
    "recipientName": "Jane Smith",
    "specialInstructions": "Leave at front desk"
  },
  "scheduledDate": "2024-01-15",
  "scheduledTimeSlot": "12:00 PM - 2:00 PM",
  "giftMessage": "Happy Birthday!"
}
```

### Gift Order for Pickup
```json
{
  "customerPhone": "+19175551234",
  "storeNumber": 205,
  "items": [
    {
      "productId": "3080",
      "productOptionId": "Premium",
      "quantity": 1
    }
  ],
  "scheduledDate": "2024-02-14",
  "scheduledTimeSlot": "11:00 AM",
  "giftMessage": "Happy Valentine's Day my love!",
  "specialInstructions": "Please include gift wrapping"
}
```

## Validation Rules

1. **Customer Identification**: Must provide either `customerPhone` or `customerId`
2. **Store Identification**: Must provide either `storeNumber` or `franchiseeId`  
3. **Items**: Must be non-empty array with valid `productId` and `quantity`
4. **Fulfillment Type**: If `deliveryAddress` provided, it's delivery; otherwise pickup
5. **Delivery Address**: If delivery, `street`, `city`, `state`, `zipCode` are required
6. **Scheduling**: `scheduledDate` and `scheduledTimeSlot` are always required
7. **Phone Format**: Must be E164 format starting with "+"

## Error Prevention

- Use 4-digit product IDs, not full product names
- Use option names (Large/Small) not descriptions  
- Include country code in phone numbers (+1 for US)
- Use standard state abbreviations (CA, NY, TX, etc.)
- Ensure delivery time slots are ranges (e.g., "2:00 PM - 4:00 PM")
- Ensure pickup times are specific (e.g., "2:00 PM")

## Important Notes

- The system automatically creates customer records for new phone numbers
- Product validation happens server-side with helpful error messages
- Store numbers map to franchise locations automatically
- Orders appear immediately in the customer's profile dashboard
- Return pure JSON only - no backticks, markdown, or extra text
- Your output will be used directly in: `curl -d '{your_json_output}'` 