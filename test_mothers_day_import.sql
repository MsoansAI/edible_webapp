-- MOTHER'S DAY IMPORT VERIFICATION TEST SCRIPT
-- Run this to verify all Mother's Day products were imported correctly

-- Test 1: Verify all 9 Mother's Day products were imported
SELECT 
  'Products Imported' as test_name,
  COUNT(*) as actual_count,
  9 as expected_count,
  CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END as status
FROM products 
WHERE product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469);

-- Test 2: Verify product options were created correctly
SELECT 
  'Product Options Created' as test_name,
  COUNT(*) as actual_count,
  15 as expected_count, -- Total options across all products
  CASE WHEN COUNT(*) = 15 THEN 'PASS' ELSE 'FAIL' END as status
FROM product_options po
JOIN products p ON po.product_id = p.id
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469);

-- Test 3: Verify Mother's Day category associations
SELECT 
  'Mother''s Day Category Associations' as test_name,
  COUNT(*) as actual_count,
  9 as expected_count,
  CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END as status
FROM product_categories pc
JOIN products p ON pc.product_id = p.id
JOIN categories c ON pc.category_id = c.id
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469)
  AND c.name = 'Mother''s Day';

-- Test 4: Verify ingredient associations were created
SELECT 
  'Ingredient Associations' as test_name,
  COUNT(*) as actual_count,
  10 as expected_count, -- Approximate based on product types
  CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END as status
FROM product_ingredients pi
JOIN products p ON pi.product_id = p.id
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469);

-- Test 5: Verify inventory was created for all products
SELECT 
  'Inventory Records Created' as test_name,
  COUNT(*) as actual_count,
  9 as expected_count, -- One per product per franchisee
  CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END as status
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469);

-- Test 6: Verify chatbot flat table synchronization
SELECT 
  'Chatbot Flat Table Sync' as test_name,
  COUNT(*) as actual_count,
  9 as expected_count,
  CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END as status
FROM chatbot_products_flat cp
WHERE (cp.product_data->'product_info'->>'product_identifier')::integer IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469);

-- Test 7: Detailed product verification
SELECT 
  'Product Details' as section,
  p.product_identifier,
  p.name,
  p.base_price,
  (SELECT COUNT(*) FROM product_options po WHERE po.product_id = p.id) as option_count,
  (SELECT COUNT(*) FROM product_categories pc WHERE pc.product_id = p.id) as category_count,
  (SELECT COUNT(*) FROM product_ingredients pi WHERE pi.product_id = p.id) as ingredient_count
FROM products p 
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469)
ORDER BY p.product_identifier;

-- Test 8: Sample product options verification
SELECT 
  'Product Options Sample' as section,
  p.name as product_name,
  po.option_name,
  po.price,
  po.description
FROM products p
JOIN product_options po ON p.id = po.product_id
WHERE p.product_identifier IN (6444, 9469) -- Products with multiple options
ORDER BY p.product_identifier, po.option_name;

-- Test 9: Category and ingredient associations sample
SELECT 
  'Associations Sample' as section,
  p.name as product_name,
  c.name as category_name,
  i.name as ingredient_name,
  i.is_allergen
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_ingredients pi ON p.id = pi.product_id
LEFT JOIN ingredients i ON pi.ingredient_id = i.id
WHERE p.product_identifier IN (3075, 7077, 7224)
ORDER BY p.product_identifier, c.name, i.name;

-- Summary Report
SELECT 
  'IMPORT SUMMARY' as report_type,
  'Mother''s Day Products Successfully Imported' as message,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT po.id) as total_options,
  COUNT(DISTINCT pc.id) as total_category_associations,
  COUNT(DISTINCT pi.id) as total_ingredient_associations
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN product_ingredients pi ON p.id = pi.product_id
WHERE p.product_identifier IN (3075, 6432, 6444, 6445, 6479, 7077, 7224, 7908, 9469); 