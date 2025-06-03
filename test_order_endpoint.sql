-- Test Suite: Edge Function 'order' (GET, POST, PATCH)

-- =====================================================
-- TEST 1: GET - Retrieve most recent order for customer (streamlined)
-- =====================================================
SELECT 'TEST 1a: Most recent order for customer (streamlined)' AS test_name;
-- HTTP GET: /functions/v1/order?customerId=test-customer-uuid&outputType=streamlined
-- Expected: Customer-friendly order summary

SELECT 'TEST 1b: Most recent order for customer (full JSON)' AS test_name;
-- HTTP GET: /functions/v1/order?customerId=test-customer-uuid&outputType=json
-- Expected: Full chatbot_orders_flat.order_data JSON

SELECT order_id, order_data->'order_info'->>'order_number' AS order_number, last_updated
FROM chatbot_orders_flat
WHERE order_data->'customer_info'->>'id' = 'test-customer-uuid'
ORDER BY last_updated DESC
LIMIT 1;

-- =====================================================
-- TEST 2: GET - Retrieve order by last 4 digits (with output type)
-- =====================================================
SELECT 'TEST 2a: Order by last 4 digits (streamlined)' AS test_name;
-- HTTP GET: /functions/v1/order?orderNumber=1234&outputType=streamlined

SELECT 'TEST 2b: Order by last 4 digits (full JSON)' AS test_name;
-- HTTP GET: /functions/v1/order?orderNumber=1234&outputType=json

SELECT order_id, order_data->'order_info'->>'order_number' AS order_number
FROM chatbot_orders_flat
WHERE order_data->'order_info'->>'order_number' LIKE '%1234-%'
ORDER BY last_updated DESC
LIMIT 1;

-- =====================================================
-- TEST 3: POST - Create a new order (with output type parameter)
-- =====================================================
-- HTTP POST: /functions/v1/order
-- Example payload:
-- {
--   "customerId": "test-customer-uuid",
--   "franchiseeId": "test-franchisee-uuid",
--   "items": [
--     { "productId": "test-product-uuid", "quantity": 1 }
--   ],
--   "deliveryAddress": {
--     "street": "123 Main St",
--     "city": "New York",
--     "state": "NY",
--     "zipCode": "10001"
--   },
--   "outputType": "streamlined"  // Optional: "streamlined" (default) or "json"
-- }
-- Check that a new order appears in chatbot_orders_flat for this customer after POST.

-- =====================================================
-- TEST 4: PATCH - Update an order (allowed, with output type)
-- =====================================================
-- HTTP PATCH: /functions/v1/order
-- Example payload:
-- {
--   "orderId": "test-order-uuid",
--   "updates": { "special_instructions": "Leave at back door" },
--   "outputType": "json"  // Optional: "streamlined" (default) or "json"
-- }
-- Check that the order is updated in chatbot_orders_flat if status is not 'shipped' or 'delivered'.

-- =====================================================
-- TEST 5: PATCH - Update forbidden (order shipped/delivered)
-- =====================================================
-- HTTP PATCH: /functions/v1/order
-- Example payload:
-- {
--   "orderId": "test-order-uuid",
--   "updates": { "special_instructions": "Change instructions" },
--   "outputType": "streamlined"
-- }
-- Check that the update is rejected if order status is 'shipped' or 'delivered'.

-- =====================================================
-- OUTPUT TYPE PARAMETER OPTIONS:
-- =====================================================
-- outputType: "streamlined" (default)
--   - Customer-friendly order summary
--   - Similar to existing create-order response format
--   - Simplified order details, formatted prices, human-readable
--
-- outputType: "json" 
--   - Full chatbot_orders_flat.order_data JSON
--   - Complete order information from flat table
--   - All nested data intact for advanced processing 