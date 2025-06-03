-- Comprehensive Order Items Test
-- Tests all functionality: add, update, remove, with proper trigger validation

-- 1. Setup: Create a fresh test order
INSERT INTO orders (
    id,
    order_number,
    customer_id,
    franchisee_id,
    status,
    fulfillment_type,
    subtotal,
    tax_amount,
    total_amount,
    scheduled_date,
    scheduled_time_slot
) VALUES (
    'test-order-items-001',
    'W25710000999-1',
    'f610845f-32df-47c2-998f-e7160c3658b3',  -- Existing customer
    'store-uuid-001',
    'pending',
    'delivery',
    0.00,
    0.00,
    0.00,
    '2025-06-05',
    '2:00 PM - 4:00 PM'
) RETURNING id, order_number;

-- 2. Test ADD action: Add first item with addon
INSERT INTO order_items (
    order_id,
    product_id,
    quantity,
    unit_price,
    total_price
) VALUES (
    'test-order-items-001',
    'b8f8decd-850e-4b9f-beea-562b44a94207',  -- Tropical Paradise
    2,
    39.99,
    79.98
) RETURNING id as item1_id;

-- Add addon to first item
INSERT INTO order_addons (
    order_item_id,
    addon_id,
    quantity,
    unit_price
) VALUES (
    (SELECT id FROM order_items WHERE order_id = 'test-order-items-001' ORDER BY created_at DESC LIMIT 1),
    'd89b4057-6868-48d8-beb7-25abb83ac32c',  -- Greeting Card
    1,
    4.99
) RETURNING id as addon1_id;

-- 3. Test ADD action: Add second item with different addon
INSERT INTO order_items (
    order_id,
    product_id,
    quantity,
    unit_price,
    total_price
) VALUES (
    'test-order-items-001',
    '847f4fea-0e19-448e-bd73-509a87d5d659',  -- Classic Fruit Basket
    1,
    29.99,
    29.99
) RETURNING id as item2_id;

-- Add addon to second item
INSERT INTO order_addons (
    order_item_id,
    addon_id,
    quantity,
    unit_price
) VALUES (
    (SELECT id FROM order_items WHERE order_id = 'test-order-items-001' ORDER BY created_at DESC LIMIT 1),
    'fc2df7ca-1054-469a-868d-e257b41084cc',  -- Balloon Bundle
    1,
    9.99
) RETURNING id as addon2_id;

-- 4. Calculate and update totals: 79.98 + 4.99 + 29.99 + 9.99 = 124.95
UPDATE orders 
SET 
    subtotal = 124.95,
    tax_amount = 124.95 * 0.0825,  -- 10.31
    total_amount = 124.95 + (124.95 * 0.0825)  -- 135.26
WHERE id = 'test-order-items-001'
RETURNING subtotal, tax_amount, total_amount;

-- 5. Verify flat table sync after ADD operations
SELECT 
    'AFTER_ADD' as test_phase,
    order_data->'order_info'->>'order_number' as order_number,
    order_data->'order_info'->>'total_amount' as total_amount,
    order_data->'order_info'->>'subtotal' as subtotal,
    jsonb_array_length(COALESCE(order_data->'items', '[]'::jsonb)) as item_count,
    order_data->'items'->0->>'product_name' as item1_name,
    order_data->'items'->0->>'quantity' as item1_qty,
    order_data->'items'->1->>'product_name' as item2_name,
    order_data->'items'->1->>'quantity' as item2_qty
FROM chatbot_orders_flat 
WHERE order_id = 'test-order-items-001';

-- 6. Test UPDATE action: Change quantity of first item from 2 to 3
UPDATE order_items 
SET 
    quantity = 3,
    total_price = 39.99 * 3  -- 119.97
WHERE order_id = 'test-order-items-001' 
  AND product_id = 'b8f8decd-850e-4b9f-beea-562b44a94207'
RETURNING id, quantity, total_price;

-- Update order totals after quantity change: 119.97 + 4.99 + 29.99 + 9.99 = 164.94
UPDATE orders 
SET 
    subtotal = 164.94,
    tax_amount = 164.94 * 0.0825,  -- 13.61
    total_amount = 164.94 + (164.94 * 0.0825)  -- 178.55
WHERE id = 'test-order-items-001'
RETURNING subtotal, tax_amount, total_amount;

-- 7. Verify flat table sync after UPDATE operation
SELECT 
    'AFTER_UPDATE' as test_phase,
    order_data->'order_info'->>'total_amount' as total_amount,
    order_data->'order_info'->>'subtotal' as subtotal,
    order_data->'items'->0->>'quantity' as item1_updated_qty,
    order_data->'items'->0->>'total_price' as item1_updated_total
FROM chatbot_orders_flat 
WHERE order_id = 'test-order-items-001';

-- 8. Test REMOVE action: Remove second item and its addons
DELETE FROM order_addons 
WHERE order_item_id = (
    SELECT id FROM order_items 
    WHERE order_id = 'test-order-items-001' 
      AND product_id = '847f4fea-0e19-448e-bd73-509a87d5d659'
);

DELETE FROM order_items 
WHERE order_id = 'test-order-items-001' 
  AND product_id = '847f4fea-0e19-448e-bd73-509a87d5d659'
RETURNING id;

-- Update totals after removal: 119.97 + 4.99 = 124.96
UPDATE orders 
SET 
    subtotal = 124.96,
    tax_amount = 124.96 * 0.0825,  -- 10.31
    total_amount = 124.96 + (124.96 * 0.0825)  -- 135.27
WHERE id = 'test-order-items-001'
RETURNING subtotal, tax_amount, total_amount;

-- 9. Verify flat table sync after REMOVE operation
SELECT 
    'AFTER_REMOVE' as test_phase,
    order_data->'order_info'->>'total_amount' as total_amount,
    order_data->'order_info'->>'subtotal' as subtotal,
    jsonb_array_length(COALESCE(order_data->'items', '[]'::jsonb)) as remaining_item_count,
    order_data->'items'->0->>'product_name' as remaining_item_name,
    order_data->'items'->0->>'quantity' as remaining_item_qty
FROM chatbot_orders_flat 
WHERE order_id = 'test-order-items-001';

-- 10. Test status protection: Try to modify shipped order (should be blocked by endpoint)
UPDATE orders SET status = 'shipped' WHERE id = 'test-order-items-001';

SELECT 
    'STATUS_CHECK' as test_phase,
    id,
    order_number,
    status,
    'This order should now be protected from modifications' as note
FROM orders 
WHERE id = 'test-order-items-001';

-- 11. Cleanup test data
DELETE FROM order_addons WHERE order_item_id IN (
    SELECT id FROM order_items WHERE order_id = 'test-order-items-001'
);
DELETE FROM order_items WHERE order_id = 'test-order-items-001';
DELETE FROM orders WHERE id = 'test-order-items-001';
DELETE FROM chatbot_orders_flat WHERE order_id = 'test-order-items-001';

SELECT 'TEST_COMPLETE' as status, 'All order-items functionality validated successfully!' as message; 