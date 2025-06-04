# Updated itemChange Tool Prompt - With Product Options Support

## Task
Return only a JSON format with the correct data based on the specific action to perform. Do not add any comments or back ticks.

## Format
```json
{
    "action": "add|update|remove",
    "itemId": "string", // for update/remove by specific order item
    "productId": "string", // for add (4-digit or UUID) or update/remove by product
    "productOptionId": "string", // ⭐ NEW: for adding specific product variants
    "quantity": number,
    "addons": [{"addonId": "string", "quantity": number}]
}
```

## Specific Examples

### Basic Add Action
If you want to perform an 'add' action:
```json
{
    "action": "add",
    "productId": "3075",
    "quantity": 2
}
```

### ⭐ NEW: Add Product with Specific Option (CRITICAL for Carousel Integration)
If you want to add a product with a specific option/variant:
```json
{
    "action": "add",
    "productId": "1001",
    "productOptionId": "8f1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "quantity": 1
}
```

### Remove Action
If you want to perform a 'remove' action:
```json
{
    "action": "remove",
    "productId": "3075"
}
```

### Update Action
If you want to perform an 'update' action:
```json
{
    "action": "update",
    "productId": "3075",
    "quantity": 3
}
```

## Alternative Examples for Specific Order Items

### Update Specific Order Item by UUID
If you want to update a specific order item by its UUID:
```json
{
    "action": "update",
    "itemId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 1
}
```

### Remove Specific Order Item by UUID
If you want to remove a specific order item by its UUID:
```json
{
    "action": "remove",
    "itemId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## With Addons Examples

### Add Product with Addons
If you want to add a product with addons:
```json
{
    "action": "add",
    "productId": "3075",
    "quantity": 1,
    "addons": [
        {"addonId": "addon-123", "quantity": 1},
        {"addonId": "addon-456", "quantity": 2}
    ]
}
```

### ⭐ Add Product Option with Addons (Complete Example)
If you want to add a specific product variant with addons:
```json
{
    "action": "add",
    "productId": "1001",
    "productOptionId": "8f1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "quantity": 1,
    "addons": [
        {"addonId": "balloon-bundle", "quantity": 1}
    ]
}
```

## Key Rules
- Use "productId" for product-based operations (4-digit ID like "3075" or UUID)
- Use "itemId" only when targeting a specific order item by its UUID
- **⭐ Use "productOptionId" when adding specific product variants/options from carousel selections**
- "quantity" is required for add and update actions
- "addons" is optional and only used with add or update actions
- Always include only the fields needed for your specific action

## When to Use productOptionId
- **Carousel Option Selection**: When user selects a specific variant (Small, Large, etc.) from the options popup
- **Product Variants**: When the product has multiple sizes, occasions, or styles
- **Pricing Override**: The option price will override the base product price
- **Database Storage**: The system stores both product_id and product_option_id for proper tracking

## Example Workflow from Carousel to API
1. User clicks "See Options" on Premium Chocolate Berry Bouquet (productId: "1001")
2. Options popup shows: Small ($49.99), Large ($65.99)
3. User selects "Large" (optionId: "8f1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e")
4. itemChange call: `{"action": "add", "productId": "1001", "productOptionId": "8f1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e", "quantity": 1}`
5. Order item added with Large variant pricing ($65.99 instead of base $49.99)

## Critical Integration Points
- ✅ Dynamic carousel generates both productId and optionId
- ✅ Voiceflow button handling extracts option details
- ✅ Order Items API accepts productOptionId parameter
- ✅ Database stores product_option_id for accurate tracking
- ✅ Option pricing overrides base product pricing 