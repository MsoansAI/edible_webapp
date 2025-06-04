    ## Task
    Return only a JSON format with the correct data based on the specific action to perform. Do not add any comments or back ticks.

    ## Format
    {
        "action": "add|update|remove",
        "itemId": "string", // for update/remove by specific order item
        "productId": "string", // for add (4-digit or UUID) or update/remove by product
        "optionName": "string", 
        "quantity": number,
        "addons": [{"addonId": "string", "quantity": number}]
    }

    ## Specific Examples

    ### Basic Add Action
    If you want to perform an 'add' action:
    {
        "action": "add",
        "productId": "3075",
        "quantity": 2
    }

    ### Add Product with Specific Option
    If you want to add a product with a specific variant/size:
    {
        "action": "add",
        "productId": "1001",
        "optionName": "Large",
        "quantity": 1
    }

    ### Remove Action
    If you want to perform a 'remove' action:
    {
        "action": "remove",
        "productId": "3075"
    }

    ### Update Action
    If you want to perform an 'update' action:
    {
        "action": "update",
        "productId": "3075",
        "quantity": 3
    }

    ## Alternative Examples for Specific Order Items

    ### Update by Item UUID
    If you want to update a specific order item by its UUID:
    {
        "action": "update",
        "itemId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 1
    }

    ### Remove by Item UUID
    If you want to remove a specific order item by its UUID:
    {
        "action": "remove",
        "itemId": "550e8400-e29b-41d4-a716-446655440000"
    }

    ## With Addons Example
    If you want to add a product with addons:
    {
        "action": "add",
        "productId": "3075",
        "quantity": 1,
        "addons": [
            {"addonId": "addon-123", "quantity": 1},
            {"addonId": "addon-456", "quantity": 2}
        ]
    }

    ## Complete Example with Option and Addons
    {
        "action": "add",
        "productId": "1001",
        "optionName": "Large",
        "quantity": 1,
        "addons": [
            {"addonId": "addon-123", "quantity": 1}
        ]
    }

    ## Real Workflow Examples

    ### Example 1: Customer says "Add a large chocolate strawberry bouquet"
    1. User selects "Premium Chocolate Berry Bouquet" from carousel (productId: "1001")
    2. Options popup shows: Small ($49.99), Large ($65.99)
    3. User clicks "Large" option
    4. You should respond:
    {
        "action": "add",
        "productId": "1001",
        "optionName": "Large",
        "quantity": 1
    }

    ### Example 2: Customer says "Change my chocolate strawberries to the large size"
    {
        "action": "update",
        "productId": "3075",
        "optionName": "Large",
        "quantity": 1
    }

    ### Example 3: Customer says "Remove the small bouquet"
    {
        "action": "remove",
        "productId": "1001"
    }

    ## Option Name Guidelines
    - Use exact option names like: "Small", "Large", "Regular", "Premium", "Deluxe"
    - Be case-insensitive: "large" = "Large" = "LARGE"
    - Common option names: "Small", "Medium", "Large", "Regular", "Premium", "Deluxe", "Standard"

    ## Key Rules
    - Use "productId" for product-based operations (4-digit ID like "3075" or UUID)
    - Use "itemId" only when targeting a specific order item by its UUID
    - Use "optionName" for human-readable option variants (NEW!)
    - "quantity" is required for add and update actions
    - "addons" is optional and only used with add or update actions
    - Always include only the fields needed for your specific action
    - Option names are case-insensitive and will be resolved automatically

    ## Error Handling
    If an option name is not found:
    - The system will return an error listing available options
    - Use the exact option names provided in the error message

    ## LLM Conversation Examples

    ### User: "Add the large chocolate strawberries to my order"
    {
        "action": "add",
        "productId": "1001",
        "optionName": "Large",
        "quantity": 1
    }

    ### User: "I want the small version of that bouquet"
    {
        "action": "add",
        "productId": "1001", 
        "optionName": "Small",
        "quantity": 1
    }

    ### User: "Add 2 birthday arrangements, the regular size"
    {
        "action": "add",
        "productId": "2045",
        "optionName": "Regular",
        "quantity": 2
    }
