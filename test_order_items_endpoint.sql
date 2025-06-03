-- Test Order Items Endpoint
-- This tests the individual functionality before testing the edge function

-- 1. Select a pending order to test with
SELECT 
    o.id as order_id,
    o.order_number,
    o.status,
    o.subtotal,
    o.total_amount,
    COUNT(oi.id) as current_item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'pending'
GROUP BY o.id, o.order_number, o.status, o.subtotal, o.total_amount
ORDER BY o.created_at DESC
LIMIT 1;

-- Test adding items manually (simulating the endpoint)
INSERT INTO order_items (
    order_id, 
    product_id, 
    quantity, 
    unit_price, 
    total_price
) VALUES (
    '8d92be18-67fa-49b5-b31a-dea925563a86',  -- Order ID
    'b8f8decd-850e-4b9f-beea-562b44a94207',  -- Tropical Paradise Arrangement
    2,
    39.99,
    79.98
) RETURNING id as new_item_id;

-- Test adding addon (will use the returned item_id from above)
-- Need to get the item_id first
SELECT id FROM order_items 
WHERE order_id = '8d92be18-67fa-49b5-b31a-dea925563a86'
ORDER BY created_at DESC 
LIMIT 1; 