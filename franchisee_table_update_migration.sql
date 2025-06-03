-- Migration: Update Franchisees Table Structure (No delivery_zone_zips in franchisees)
-- Only delivery_zones table holds zip codes

-- Step 1: Remove delivery_zone_zips from franchisees if it exists
ALTER TABLE franchisees DROP COLUMN IF EXISTS delivery_zone_zips;

-- Step 2: Add store_number and updated_at columns if not present
ALTER TABLE franchisees 
ADD COLUMN IF NOT EXISTS store_number INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Step 3: Add unique and check constraints for store_number
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'franchisees_store_number_unique'
          AND table_name = 'franchisees'
    ) THEN
        ALTER TABLE franchisees
        ADD CONSTRAINT franchisees_store_number_unique UNIQUE (store_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'franchisees_store_number_check'
          AND table_name = 'franchisees'
    ) THEN
        ALTER TABLE franchisees
        ADD CONSTRAINT franchisees_store_number_check CHECK (store_number >= 100 AND store_number <= 999);
    END IF;
END $$;

-- Step 4: Insert or update franchisee sample data (no delivery_zone_zips)
INSERT INTO franchisees (
    store_number,
    name,
    email, 
    phone,
    address,
    city,
    state,
    zip_code,
    opening_hours,
    is_active,
    created_at,
    updated_at
) VALUES (
    257,
    'Edible Store #257 San Diego',
    'ca257@edible.store',
    '(858) 585-4156',
    '4340 Genesee ave, #101, San Diego, CA 92117',
    'San Diego',
    'CA',
    '92117',
    jsonb_build_object(
        'monday', '9:00am - 7:00pm',
        'tuesday', '9:00am - 7:00pm',
        'wednesday', '9:00am - 7:00pm', 
        'thursday', '9:00am - 7:00pm',
        'friday', '9:00am - 7:00pm',
        'saturday', '9:00am - 7:00pm',
        'sunday', '9:00am - 3:00pm'
    ),
    true,
    NOW(),
    NOW()
) ON CONFLICT (store_number) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    opening_hours = EXCLUDED.opening_hours,
    updated_at = NOW();

INSERT INTO franchisees (
    store_number,
    name,
    email,
    phone, 
    address,
    city,
    state,
    zip_code,
    opening_hours,
    is_active,
    created_at,
    updated_at
) VALUES (
    263,
    'Edible Store #263 Torrance',
    'ca263@edible.store',
    '(310) 370-8828',
    '20034 Hawthorne Blvd STE A, Torrance, CA 90503',
    'Torrance',
    'CA',
    '90503',
    jsonb_build_object(
        'monday', '9:00am - 7:00pm',
        'tuesday', '9:00am - 7:00pm',
        'wednesday', '9:00am - 7:00pm',
        'thursday', '9:00am - 7:00pm', 
        'friday', '9:00am - 7:00pm',
        'saturday', '9:00am - 7:00pm',
        'sunday', '9:00am - 3:00pm'
    ),
    true,
    NOW(),
    NOW()
) ON CONFLICT (store_number) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    opening_hours = EXCLUDED.opening_hours,
    updated_at = NOW();

-- Step 5: Insert or update delivery_zones for each store
-- Store #257 San Diego
INSERT INTO delivery_zones (
    franchisee_id, zip_codes, delivery_fee, min_order_amount
) SELECT id, ARRAY['92101','92102','92103','92105','92106','92107','92108','92109','92110','92113','92116','92911','92037','92123','92124','92014','92121','92122','92126','92127','92128','92129','92131','92130'], 5.99, 25.00
FROM franchisees WHERE store_number = 257
ON CONFLICT (franchisee_id) DO UPDATE SET
    zip_codes = EXCLUDED.zip_codes,
    delivery_fee = EXCLUDED.delivery_fee,
    min_order_amount = EXCLUDED.min_order_amount;

-- Store #263 Torrance
INSERT INTO delivery_zones (
    franchisee_id, zip_codes, delivery_fee, min_order_amount
) SELECT id, ARRAY['90501','90502','90503','90504','90505','90506','90507','90508','90509','90510','90277','90278','90266','90254','90275','90274','90731','90732','90733','90745','90746','90747','90749','90247','90248','90249','90717','90301','90302','90303','90304','90305','90306','90307','90308','90309','90310','90311','90312','90250','90251'], 5.99, 25.00
FROM franchisees WHERE store_number = 263
ON CONFLICT (franchisee_id) DO UPDATE SET
    zip_codes = EXCLUDED.zip_codes,
    delivery_fee = EXCLUDED.delivery_fee,
    min_order_amount = EXCLUDED.min_order_amount;

-- Step 6: Update existing opening_hours column to use better format
UPDATE franchisees 
SET opening_hours = jsonb_build_object(
    'monday', '9:00am - 6:00pm',
    'tuesday', '9:00am - 6:00pm', 
    'wednesday', '9:00am - 6:00pm',
    'thursday', '9:00am - 6:00pm',
    'friday', '9:00am - 6:00pm',
    'saturday', '9:00am - 6:00pm',
    'sunday', '10:00am - 5:00pm'
) WHERE opening_hours IS NULL OR opening_hours = '{}';

-- Step 7: Create updated trigger function for franchisees flat table sync
CREATE OR REPLACE FUNCTION sync_chatbot_franchisees_flat(target_franchisee_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    franchise_record RECORD;
    delivery_zone_record RECORD;
    inventory_stats RECORD;
    result_count INTEGER := 0;
BEGIN
    -- Handle single franchisee or all franchisees
    FOR franchise_record IN 
        SELECT f.* FROM franchisees f 
        WHERE (target_franchisee_id IS NULL OR f.id = target_franchisee_id)
          AND f.is_active = true
    LOOP
        -- Get delivery zone info
        SELECT 
            COALESCE(dz.zip_codes, '{}') as zone_zips,
            COALESCE(dz.delivery_fee, 5.99) as fee,
            COALESCE(dz.min_order_amount, 25.00) as min_amount
        INTO delivery_zone_record
        FROM franchisees f
        LEFT JOIN delivery_zones dz ON dz.franchisee_id = f.id
        WHERE f.id = franchise_record.id;

        -- Get inventory stats
        SELECT 
            COUNT(*) as total_products,
            COUNT(*) FILTER (WHERE quantity_available = 0) as out_of_stock,
            COUNT(*) FILTER (WHERE quantity_available > 0 AND quantity_available <= 5) as low_stock
        INTO inventory_stats
        FROM inventory 
        WHERE franchisee_id = franchise_record.id;

        -- Insert or update flat table
        INSERT INTO chatbot_franchisees_flat (franchisee_id, franchisee_data, last_updated)
        VALUES (
            franchise_record.id,
            jsonb_build_object(
                'store_info', jsonb_build_object(
                    'id', franchise_record.id,
                    'store_number', franchise_record.store_number,
                    'name', franchise_record.name,
                    'email', franchise_record.email,
                    'phone', franchise_record.phone,
                    'address', franchise_record.address,
                    'city', franchise_record.city,
                    'state', franchise_record.state,
                    'zip_code', franchise_record.zip_code
                ),
                'opening_hours', COALESCE(franchise_record.opening_hours, '{}'::jsonb),
                'delivery_info', jsonb_build_object(
                    'delivery_zones', COALESCE(delivery_zone_record.zone_zips, '{}'),
                    'delivery_fee', COALESCE(delivery_zone_record.fee, 5.99),
                    'min_order_amount', COALESCE(delivery_zone_record.min_amount, 25.00)
                ),
                'inventory_summary', jsonb_build_object(
                    'total_products', COALESCE(inventory_stats.total_products, 0),
                    'out_of_stock_count', COALESCE(inventory_stats.out_of_stock, 0),
                    'low_stock_count', COALESCE(inventory_stats.low_stock, 0)
                )
            ),
            NOW()
        )
        ON CONFLICT (franchisee_id) 
        DO UPDATE SET 
            franchisee_data = EXCLUDED.franchisee_data,
            last_updated = EXCLUDED.last_updated;

        result_count := result_count + 1;
    END LOOP;

    RETURN 'Synced ' || result_count || ' franchisee record(s) to flat table';
END;
$$;

-- Step 8: Update triggers to use new sync function
DROP TRIGGER IF EXISTS franchisees_sync_trigger ON franchisees;
CREATE TRIGGER franchisees_sync_trigger
    AFTER INSERT OR UPDATE ON franchisees
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_franchisees();

-- Create trigger function for franchisees
CREATE OR REPLACE FUNCTION trigger_sync_franchisees()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM sync_chatbot_franchisees_flat(NEW.id);
    RETURN NEW;
END;
$$;

-- Step 9: Sync all franchisees to flat table
SELECT sync_chatbot_franchisees_flat();

-- Step 10: Verification queries
SELECT 'Migration completed successfully' as status;

SELECT 
    store_number,
    name,
    city,
    array_length(delivery_zone_zips, 1) as delivery_zones_count,
    opening_hours->>'monday' as monday_hours,
    opening_hours->>'sunday' as sunday_hours
FROM franchisees 
WHERE store_number IN (257, 263)
ORDER BY store_number;

-- Step 11: Add triggers on delivery_zones to sync chatbot_franchisees_flat

-- Trigger function for delivery_zones changes
CREATE OR REPLACE FUNCTION trigger_sync_franchisees_from_delivery_zones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- For INSERT/UPDATE, use NEW.franchisee_id
    PERFORM sync_chatbot_franchisees_flat(NEW.franchisee_id);
    RETURN NEW;
END;
$$;

-- Trigger function for delivery_zones DELETE
CREATE OR REPLACE FUNCTION trigger_sync_franchisees_from_delivery_zones_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- For DELETE, use OLD.franchisee_id
    PERFORM sync_chatbot_franchisees_flat(OLD.franchisee_id);
    RETURN OLD;
END;
$$;

-- After INSERT or UPDATE on delivery_zones
DROP TRIGGER IF EXISTS delivery_zones_sync_trigger ON delivery_zones;
CREATE TRIGGER delivery_zones_sync_trigger
    AFTER INSERT OR UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_franchisees_from_delivery_zones();

-- After DELETE on delivery_zones
DROP TRIGGER IF EXISTS delivery_zones_delete_sync_trigger ON delivery_zones;
CREATE TRIGGER delivery_zones_delete_sync_trigger
    AFTER DELETE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_franchisees_from_delivery_zones_delete();

-- Step X: Update generate_order_number() to Edible format

-- 1. Ensure the sequence exists
CREATE SEQUENCE IF NOT EXISTS edible_order_seq START 10000000;

-- 2. Replace the trigger function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    store_num TEXT;
    nextval BIGINT;
BEGIN
    IF NEW.order_number IS NULL THEN
        -- Get the 3-digit store number from franchisees
        SELECT LPAD(store_number::text, 3, '0') INTO store_num FROM franchisees WHERE id = NEW.franchisee_id;
        nextval := nextval('edible_order_seq');
        NEW.order_number := 'W' || store_num || nextval::text || '-1';
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Test: Insert a sample order and select the order_number
-- (Assumes a valid customer_id, franchisee_id, recipient_address_id exist)
-- INSERT INTO orders (customer_id, franchisee_id, recipient_address_id, status, fulfillment_type, subtotal, tax_amount, total_amount, scheduled_date, scheduled_time_slot) VALUES ('<customer_id>', '<franchisee_id>', '<recipient_address_id>', 'pending', 'delivery', 50.00, 5.00, 55.00, CURRENT_DATE, '2:00 PM - 4:00 PM');
-- SELECT order_number FROM orders ORDER BY created_at DESC LIMIT 1; 