-- Test Suite: Updated Franchisee Store Structure
-- Tests for store number, delivery zones, and opening hours

-- =====================================================
-- TEST 1: Franchisee Table Structure Validation
-- =====================================================
SELECT 'TEST 1: Checking franchisee table has required columns' as test_name;

-- Verify all expected columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'franchisees' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- TEST 2: Store Number Format Validation
-- =====================================================
SELECT 'TEST 2: Store number should be 3-digit integer' as test_name;

-- Test store numbers are valid 3-digit integers
SELECT 
    store_number,
    CASE 
        WHEN store_number >= 100 AND store_number <= 999 THEN '✅ Valid store number'
        ELSE '❌ Invalid store number (must be 100-999)'
    END as validation_result
FROM franchisees
WHERE store_number IS NOT NULL;

-- =====================================================
-- TEST 3: Delivery Zone Structure Validation
-- =====================================================
SELECT 'TEST 3: Delivery zones should be arrays of zip codes' as test_name;

-- Test delivery zones contain valid zip codes
SELECT 
    name,
    array_length(delivery_zone_zips, 1) as zip_count,
    CASE 
        WHEN delivery_zone_zips IS NULL THEN '❌ Missing delivery zones'
        WHEN array_length(delivery_zone_zips, 1) < 1 THEN '❌ Empty delivery zones'
        WHEN array_length(delivery_zone_zips, 1) > 50 THEN '⚠️ Very large delivery zone'
        ELSE '✅ Valid delivery zone size'
    END as zone_validation,
    -- Check first few zip codes for format
    CASE 
        WHEN delivery_zone_zips[1] ~ '^[0-9]{5}$' THEN '✅ Valid zip format'
        ELSE '❌ Invalid zip format (should be 5 digits)'
    END as zip_format_validation
FROM franchisees
WHERE delivery_zone_zips IS NOT NULL;

-- =====================================================
-- TEST 4: Opening Hours Structure Validation
-- =====================================================
SELECT 'TEST 4: Opening hours should be properly formatted JSONB' as test_name;

-- Test opening hours structure
SELECT 
    name,
    opening_hours,
    CASE 
        WHEN opening_hours IS NULL THEN '❌ Missing opening hours'
        WHEN jsonb_typeof(opening_hours) != 'object' THEN '❌ Hours should be JSON object'
        WHEN opening_hours ? 'monday' AND opening_hours ? 'sunday' THEN '✅ Has weekday structure'
        ELSE '⚠️ Missing some days'
    END as hours_structure_validation,
    -- Test Monday format
    CASE 
        WHEN opening_hours->>'monday' ~ '^[0-9]{1,2}:[0-9]{2}[ap]m - [0-9]{1,2}:[0-9]{2}[ap]m$' THEN '✅ Valid time format'
        ELSE '❌ Invalid time format (should be "9:00am - 7:00pm")'
    END as time_format_validation
FROM franchisees
WHERE opening_hours IS NOT NULL;

-- =====================================================
-- TEST 5: Sample Data Validation
-- =====================================================
SELECT 'TEST 5: Sample stores should be properly inserted' as test_name;

-- Test expected sample stores exist
SELECT 
    store_number,
    name,
    city,
    state,
    array_length(delivery_zone_zips, 1) as delivery_zones_count,
    CASE 
        WHEN store_number = 257 AND city = 'San Diego' THEN '✅ Store 257 San Diego found'
        WHEN store_number = 263 AND city = 'Torrance' THEN '✅ Store 263 Torrance found'
        ELSE '⚠️ Unexpected store'
    END as sample_validation
FROM franchisees 
WHERE store_number IN (257, 263)
ORDER BY store_number;

-- =====================================================
-- TEST 6: Delivery Zone Lookup Test
-- =====================================================
SELECT 'TEST 6: Zip code delivery lookup should work' as test_name;

-- Test finding stores by delivery zip codes
SELECT 
    store_number,
    name,
    city,
    '✅ Delivers to 92101' as delivery_test
FROM franchisees 
WHERE '92101' = ANY(delivery_zone_zips);

SELECT 
    store_number,
    name,
    city,
    '✅ Delivers to 90501' as delivery_test
FROM franchisees 
WHERE '90501' = ANY(delivery_zone_zips);

-- =====================================================
-- TEST 7: Hours Parsing Test
-- =====================================================
SELECT 'TEST 7: Opening hours should be parseable for today' as test_name;

-- Test extracting today's hours
SELECT 
    name,
    opening_hours->>'monday' as monday_hours,
    opening_hours->>'sunday' as sunday_hours,
    CASE 
        WHEN opening_hours->>'monday' IS NOT NULL THEN '✅ Monday hours available'
        ELSE '❌ Monday hours missing'
    END as monday_validation,
    CASE 
        WHEN opening_hours->>'sunday' IS NOT NULL THEN '✅ Sunday hours available'
        ELSE '❌ Sunday hours missing'
    END as sunday_validation
FROM franchisees 
WHERE store_number IN (257, 263);

-- =====================================================
-- TEST 8: Phone and Email Format Validation
-- =====================================================
SELECT 'TEST 8: Contact information should be properly formatted' as test_name;

SELECT 
    store_number,
    name,
    phone,
    email,
    CASE 
        WHEN phone ~ '^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$' THEN '✅ Valid phone format'
        ELSE '❌ Invalid phone format (should be (XXX) XXX-XXXX)'
    END as phone_validation,
    CASE 
        WHEN email ~ '^ca[0-9]{3}@edible\.store$' THEN '✅ Valid email format'
        ELSE '❌ Invalid email format (should be caXXX@edible.store)'
    END as email_validation
FROM franchisees 
WHERE store_number IN (257, 263);

-- =====================================================
-- SUMMARY: All Tests
-- =====================================================
SELECT 'SUMMARY: Franchisee table update validation complete' as final_result;

SELECT * FROM (
    VALUES 
    ('Table Structure', 'Verify store_number, delivery_zone_zips, opening_hours columns exist'),
    ('Store Numbers', 'Validate 3-digit store numbers (257, 263)'),
    ('Delivery Zones', 'Validate zip code arrays for San Diego and Torrance'),
    ('Opening Hours', 'Validate JSONB structure with all days'),
    ('Contact Info', 'Validate phone and email formats'),
    ('Sample Data', 'Verify both sample stores inserted correctly'),
    ('Lookup Functions', 'Test delivery zone and hours queries work')
) as test_category(area, description); 