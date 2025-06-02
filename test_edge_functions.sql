-- Edge Functions Test Suite
-- Tests to verify all edge functions are working correctly after fixing boot errors

-- Test 1: Product Search Function
SELECT 'TEST 1: Product Search Function' as test_name;

-- This should return Mother's Day products when we test the fixed function
-- curl -X POST "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/product-search" \
--   -H "Authorization: Bearer [anon_key]" \
--   -H "Content-Type: application/json" \
--   -d '{"query": "strawberry"}'

-- Expected: Should return products with strawberry in name/description
-- Status: PENDING (waiting for function fix)

-- Test 2: Voice Agent Function
SELECT 'TEST 2: Voice Agent Function' as test_name;

-- This should return appropriate voice responses
-- curl -X POST "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/voice-agent" \
--   -H "Authorization: Bearer [anon_key]" \
--   -H "Content-Type: application/json" \
--   -d '{"intent": "product_search", "entities": {"query": "mother"}}'

-- Expected: Should return voice-friendly product search results
-- Status: PENDING (waiting for function fix)

-- Test 3: Customer Management Function
SELECT 'TEST 3: Customer Management Function' as test_name;

-- This should handle customer find-or-create
-- curl -X POST "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/customer-management/find-or-create" \
--   -H "Authorization: Bearer [anon_key]" \
--   -H "Content-Type: application/json" \
--   -d '{"phone": "+1234567890", "firstName": "Test", "lastName": "User"}'

-- Expected: Should create or find customer record
-- Status: PENDING (waiting for function fix)

-- Test 4: Franchisee Inventory Function
SELECT 'TEST 4: Franchisee Inventory Function' as test_name;

-- This should return inventory information
-- curl -X GET "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/franchisee-inventory/inventory?franchiseeId=550e8400-e29b-41d4-a716-446655440000" \
--   -H "Authorization: Bearer [anon_key]"

-- Expected: Should return inventory for the franchisee
-- Status: PENDING (waiting for function fix)

-- Test 5: Create Order Function
SELECT 'TEST 5: Create Order Function' as test_name;

-- This should create a new order (complex test)
-- Will need valid customer and product data
-- Status: PENDING (waiting for function fix)

-- Verification queries to check if we have the required data for testing
SELECT 'VERIFICATION: Available products for testing' as check_name;
SELECT 
    p.product_identifier,
    p.name,
    po.id as option_id,
    po.price
FROM products p
JOIN product_options po ON p.id = po.product_id
WHERE p.product_identifier BETWEEN 3000 AND 9999
LIMIT 5;

SELECT 'VERIFICATION: Available customers for testing' as check_name;
SELECT 
    id,
    phone,
    first_name,
    last_name,
    allergies
FROM customers
LIMIT 3;

SELECT 'VERIFICATION: Available franchisees for testing' as check_name;
SELECT 
    id,
    name,
    city,
    state,
    is_active
FROM franchisees
WHERE is_active = true
LIMIT 3;

SELECT 'VERIFICATION: Available inventory for testing' as check_name;
SELECT 
    i.franchisee_id,
    i.product_id,
    i.quantity_available,
    p.product_identifier,
    p.name
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity_available > 0
LIMIT 5;

-- Summary of what needs to be tested after fixing boot errors:
-- 1. Product search with various filters (text, category, price)
-- 2. Voice agent with different intents
-- 3. Customer management (CRUD operations)
-- 4. Franchisee inventory queries
-- 5. Order creation with validation
-- 6. CORS headers and error handling
-- 7. Authentication and authorization 