-- Customer Account Merging System
-- Enables automatic merging of customer accounts when phone and email match separate accounts

-- Function to check if two customer accounts can be safely merged
CREATE OR REPLACE FUNCTION check_merge_compatibility(p_phone TEXT, p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    phone_account RECORD;
    email_account RECORD;
    result JSONB;
BEGIN
    -- Find account by phone
    SELECT * INTO phone_account 
    FROM customers 
    WHERE phone = p_phone AND phone IS NOT NULL
    LIMIT 1;
    
    -- Find account by email (exclude temp emails)
    SELECT * INTO email_account 
    FROM customers 
    WHERE email = p_email AND email IS NOT NULL 
      AND email NOT LIKE '%@temp.local'
    LIMIT 1;
    
    -- If both accounts don't exist, no merge needed
    IF phone_account IS NULL OR email_account IS NULL THEN
        RETURN jsonb_build_object(
            'can_merge', false,
            'reason', 'insufficient_accounts',
            'phone_account_exists', phone_account IS NOT NULL,
            'email_account_exists', email_account IS NOT NULL
        );
    END IF;
    
    -- If they're the same account, no merge needed
    IF phone_account.id = email_account.id THEN
        RETURN jsonb_build_object(
            'can_merge', false,
            'reason', 'same_account',
            'account_id', phone_account.id
        );
    END IF;
    
    -- Check name compatibility (if both have names)
    IF phone_account.first_name IS NOT NULL AND phone_account.first_name != '' 
       AND email_account.first_name IS NOT NULL AND email_account.first_name != ''
       AND LOWER(phone_account.first_name) != LOWER(email_account.first_name) THEN
        RETURN jsonb_build_object(
            'can_merge', false,
            'reason', 'name_mismatch',
            'phone_name', phone_account.first_name,
            'email_name', email_account.first_name
        );
    END IF;
    
    -- Check last name compatibility
    IF phone_account.last_name IS NOT NULL AND phone_account.last_name != ''
       AND email_account.last_name IS NOT NULL AND email_account.last_name != ''
       AND LOWER(phone_account.last_name) != LOWER(email_account.last_name) THEN
        RETURN jsonb_build_object(
            'can_merge', false,
            'reason', 'lastname_mismatch',
            'phone_lastname', phone_account.last_name,
            'email_lastname', email_account.last_name
        );
    END IF;
    
    -- Count orders for each account
    DECLARE
        phone_order_count INTEGER;
        email_order_count INTEGER;
        primary_account_type TEXT;
    BEGIN
        SELECT COUNT(*) INTO phone_order_count FROM orders WHERE customer_id = phone_account.id;
        SELECT COUNT(*) INTO email_order_count FROM orders WHERE customer_id = email_account.id;
        
        -- Determine primary account strategy
        IF email_account.auth_user_id IS NOT NULL THEN
            primary_account_type := 'email'; -- Web account has priority
        ELSIF phone_order_count > email_order_count THEN
            primary_account_type := 'phone';
        ELSIF email_order_count > phone_order_count THEN
            primary_account_type := 'email';
        ELSE
            primary_account_type := 'phone'; -- Default fallback
        END IF;
        
        -- Build successful compatibility result
        result := jsonb_build_object(
            'can_merge', true,
            'primary_account', primary_account_type,
            'accounts', jsonb_build_object(
                'phone', jsonb_build_object(
                    'id', phone_account.id,
                    'name', COALESCE(phone_account.first_name || ' ' || phone_account.last_name, 'Phone Customer'),
                    'orders', phone_order_count,
                    'has_auth', phone_account.auth_user_id IS NOT NULL,
                    'email', phone_account.email
                ),
                'email', jsonb_build_object(
                    'id', email_account.id,
                    'name', COALESCE(email_account.first_name || ' ' || email_account.last_name, 'Email Customer'),
                    'orders', email_order_count,
                    'has_auth', email_account.auth_user_id IS NOT NULL,
                    'phone', email_account.phone
                )
            ),
            'total_orders_after_merge', phone_order_count + email_order_count,
            'merge_strategy', primary_account_type || '_primary'
        );
        
        RETURN result;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to perform the actual customer account merge
CREATE OR REPLACE FUNCTION merge_customer_accounts(p_phone TEXT, p_email TEXT, p_source TEXT)
RETURNS JSONB AS $$
DECLARE
    phone_account RECORD;
    email_account RECORD;
    primary_account RECORD;
    secondary_account RECORD;
    compatibility_check JSONB;
    merged_preferences JSONB;
    orders_transferred INTEGER;
    result JSONB;
BEGIN
    -- First check if merge is compatible
    SELECT check_merge_compatibility(p_phone, p_email) INTO compatibility_check;
    
    IF NOT (compatibility_check->>'can_merge')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', compatibility_check->>'reason',
            'message', 'Accounts cannot be safely merged: ' || (compatibility_check->>'reason')
        );
    END IF;
    
    -- Get the accounts
    SELECT * INTO phone_account FROM customers WHERE phone = p_phone AND phone IS NOT NULL LIMIT 1;
    SELECT * INTO email_account FROM customers WHERE email = p_email AND email IS NOT NULL AND email NOT LIKE '%@temp.local' LIMIT 1;
    
    -- Determine primary and secondary accounts based on compatibility check
    IF (compatibility_check->'primary_account')::TEXT = '"email"' THEN
        primary_account := email_account;
        secondary_account := phone_account;
    ELSE
        primary_account := phone_account;
        secondary_account := email_account;
    END IF;
    
    -- Merge preferences (union approach for safety)
    merged_preferences := COALESCE(primary_account.preferences, '{}'::JSONB) || COALESCE(secondary_account.preferences, '{}'::JSONB);
    
    -- Add merge audit trail
    merged_preferences := merged_preferences || jsonb_build_object(
        'merged_at', NOW()::TEXT,
        'merged_from', secondary_account.id,
        'merge_strategy', compatibility_check->>'merge_strategy',
        'merge_source', p_source,
        'account_sources', COALESCE(
            (merged_preferences->'account_sources')::JSONB, 
            '[]'::JSONB
        ) || 
        CASE 
            WHEN NOT ((merged_preferences->'account_sources')::JSONB ? 'phone') THEN '["phone"]'::JSONB
            ELSE '[]'::JSONB
        END ||
        CASE 
            WHEN NOT ((merged_preferences->'account_sources')::JSONB ? 'webapp') THEN '["webapp"]'::JSONB
            ELSE '[]'::JSONB
        END
    );
    
    -- Update primary account with merged data
    UPDATE customers SET
        email = CASE 
            WHEN primary_account.email IS NULL OR primary_account.email LIKE '%@temp.local' 
            THEN COALESCE(secondary_account.email, primary_account.email)
            ELSE primary_account.email
        END,
        phone = COALESCE(primary_account.phone, secondary_account.phone),
        first_name = COALESCE(
            NULLIF(primary_account.first_name, ''), 
            NULLIF(secondary_account.first_name, ''), 
            primary_account.first_name
        ),
        last_name = COALESCE(
            NULLIF(primary_account.last_name, ''), 
            NULLIF(secondary_account.last_name, ''), 
            primary_account.last_name
        ),
        allergies = COALESCE(primary_account.allergies, '{}') || COALESCE(secondary_account.allergies, '{}'),
        dietary_restrictions = COALESCE(primary_account.dietary_restrictions, '{}') || COALESCE(secondary_account.dietary_restrictions, '{}'),
        preferences = merged_preferences,
        auth_user_id = COALESCE(primary_account.auth_user_id, secondary_account.auth_user_id)
    WHERE id = primary_account.id;
    
    -- Transfer all orders from secondary to primary account
    UPDATE orders 
    SET customer_id = primary_account.id 
    WHERE customer_id = secondary_account.id;
    
    GET DIAGNOSTICS orders_transferred = ROW_COUNT;
    
    -- Transfer customer addresses
    UPDATE customer_addresses 
    SET customer_id = primary_account.id 
    WHERE customer_id = secondary_account.id;
    
    -- Transfer recipient addresses  
    UPDATE recipient_addresses 
    SET customer_id = primary_account.id 
    WHERE customer_id = secondary_account.id;
    
    -- Archive the secondary account (preserve for audit trail)
    UPDATE customers SET
        email = 'archived_' || secondary_account.id || '_' || COALESCE(secondary_account.email, 'no_email'),
        preferences = COALESCE(secondary_account.preferences, '{}'::JSONB) || jsonb_build_object(
            'archived_at', NOW()::TEXT,
            'merged_into', primary_account.id,
            'original_email', secondary_account.email,
            'original_phone', secondary_account.phone
        )
    WHERE id = secondary_account.id;
    
    -- Build success response
    result := jsonb_build_object(
        'success', true,
        'primary_account_id', primary_account.id,
        'secondary_account_id', secondary_account.id,
        'orders_transferred', orders_transferred,
        'total_orders', (compatibility_check->'total_orders_after_merge')::INTEGER,
        'merge_strategy', compatibility_check->>'merge_strategy',
        'message', 'Successfully merged ' || orders_transferred || ' orders into unified account'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Merge failed due to database error'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get merge preview information
CREATE OR REPLACE FUNCTION get_merge_preview(p_phone TEXT, p_email TEXT)
RETURNS JSONB AS $$
DECLARE
    compatibility_result JSONB;
    phone_orders INTEGER;
    email_orders INTEGER;
    phone_account RECORD;
    email_account RECORD;
BEGIN
    SELECT check_merge_compatibility(p_phone, p_email) INTO compatibility_result;
    
    IF NOT (compatibility_result->>'can_merge')::BOOLEAN THEN
        RETURN compatibility_result;
    END IF;
    
    -- Get detailed account information for preview
    SELECT * INTO phone_account FROM customers WHERE phone = p_phone LIMIT 1;
    SELECT * INTO email_account FROM customers WHERE email = p_email AND email NOT LIKE '%@temp.local' LIMIT 1;
    
    SELECT COUNT(*) INTO phone_orders FROM orders WHERE customer_id = phone_account.id;
    SELECT COUNT(*) INTO email_orders FROM orders WHERE customer_id = email_account.id;
    
    RETURN compatibility_result || jsonb_build_object(
        'preview', jsonb_build_object(
            'before', jsonb_build_object(
                'total_customers', 2,
                'phone_customer', jsonb_build_object(
                    'name', COALESCE(phone_account.first_name || ' ' || phone_account.last_name, 'Phone Customer'),
                    'orders', phone_orders,
                    'has_auth', phone_account.auth_user_id IS NOT NULL
                ),
                'email_customer', jsonb_build_object(
                    'name', COALESCE(email_account.first_name || ' ' || email_account.last_name, 'Email Customer'),
                    'orders', email_orders,
                    'has_auth', email_account.auth_user_id IS NOT NULL
                )
            ),
            'after', jsonb_build_object(
                'total_customers', 1,
                'unified_customer', jsonb_build_object(
                    'will_have_phone', true,
                    'will_have_email', true,
                    'total_orders', phone_orders + email_orders,
                    'primary_source', compatibility_result->>'primary_account'
                )
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for efficient merging operations
CREATE INDEX IF NOT EXISTS idx_customers_phone_not_null ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_not_temp ON customers(email) WHERE email NOT LIKE '%@temp.local';
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Grant permissions for edge functions to use these functions
GRANT EXECUTE ON FUNCTION check_merge_compatibility(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION merge_customer_accounts(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_merge_preview(TEXT, TEXT) TO service_role; 