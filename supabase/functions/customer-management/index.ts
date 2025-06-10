import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Rate limiting configuration
const RATE_LIMITS = {
  'product-search': {
    requests: 30,
    window: 60
  },
  'customer-management': {
    requests: 20,
    window: 60
  },
  'franchisee-inventory': {
    requests: 15,
    window: 60
  },
  'create-order': {
    requests: 10,
    window: 60
  } // 10 orders per minute
};
// Rate limiting function
async function checkRateLimit(supabase, identifier, endpoint) {
  try {
    const limit = RATE_LIMITS[endpoint];
    if (!limit) return true; // No limit configured
    const windowStart = new Date();
    windowStart.setSeconds(windowStart.getSeconds() - limit.window);
    // Clean up old entries
    await supabase.from('api_rate_limits').delete().lt('window_start', windowStart.toISOString());
    // Check current usage
    const { data: currentUsage, error } = await supabase.from('api_rate_limits').select('request_count').eq('identifier', identifier).eq('endpoint', endpoint).gte('window_start', windowStart.toISOString()).single();
    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return true; // Allow request if rate limit check fails
    }
    if (currentUsage) {
      // Update existing record
      if (currentUsage.request_count >= limit.requests) {
        return false; // Rate limit exceeded
      }
      await supabase.from('api_rate_limits').update({
        request_count: currentUsage.request_count + 1,
        created_at: new Date().toISOString()
      }).eq('identifier', identifier).eq('endpoint', endpoint).gte('window_start', windowStart.toISOString());
    } else {
      // Create new record
      await supabase.from('api_rate_limits').insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow request if rate limiting fails
  }
}
function getClientIdentifier(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown-client';
}
Deno.serve(async (req)=>{\n  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(supabase, clientId, 'customer-management');
    if (!isAllowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment and try again.',
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    const requestData = await req.json();
    
    // Enhanced validation logic to handle intro agent scenarios
    const hasPhoneOrEmail = requestData.phone || requestData.email;
    const hasAuthUser = requestData.authUserId;
    const hasSessionId = requestData.sessionId;
    
    // Allow requests if we have any of: phone/email, authenticated user, or session ID
    if (!hasPhoneOrEmail && !hasAuthUser && !hasSessionId) {
      return new Response(JSON.stringify({
        error: 'At least one identifier required',
        message: 'Please provide phone, email, user authentication, or session ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return await handleCustomerManagement(supabase, requestData);
  } catch (error) {
    console.error('Customer management error:', error);
    return new Response(JSON.stringify({
      error: 'Customer operation failed',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
async function handleCustomerManagement(supabase, requestData) {
  try {
    // Step 1: Search for existing accounts using ALL possible identifiers
    const existingAccounts = await findAllMatchingAccounts(supabase, requestData);
    if (existingAccounts.length === 0) {
      // No existing account - create new one
      return await createNewAccount(supabase, requestData);
    }
    if (existingAccounts.length === 1) {
      // Found one account - update/merge if needed
      return await updateExistingAccount(supabase, existingAccounts[0], requestData);
    }
    // Multiple accounts found - potential duplicates!
    return await handleDuplicateAccounts(supabase, existingAccounts, requestData);
  } catch (error) {
    console.error('Customer management error:', error);
    throw error;
  }
}
async function findAllMatchingAccounts(supabase, requestData) {
  const accounts = [];
  // Search by phone number
  if (requestData.phone) {
    const { data: phoneMatch } = await supabase.from('customers').select('*').eq('phone', requestData.phone);
    if (phoneMatch && phoneMatch.length > 0) {
      accounts.push(...phoneMatch);
    }
  }
  // Search by email
  if (requestData.email && !requestData.email.includes('@temp.local')) {
    const { data: emailMatch } = await supabase.from('customers').select('*').eq('email', requestData.email);
    if (emailMatch && emailMatch.length > 0) {
      // Avoid duplicates if same account found by both phone and email
      for (const account of emailMatch){
        if (!accounts.find((a)=>a.id === account.id)) {
          accounts.push(account);
        }
      }
    }
  }
  // Search by auth user ID (for web app users)
  if (requestData.authUserId) {
    const { data: authMatch } = await supabase.from('customers').select('*').eq('auth_user_id', requestData.authUserId);
    if (authMatch && authMatch.length > 0) {
      for (const account of authMatch){
        if (!accounts.find((a)=>a.id === account.id)) {
          accounts.push(account);
        }
      }
    }
  }
  // Search by session ID (for anonymous users) - stored in preferences
  if (requestData.sessionId && accounts.length === 0) {
    const { data: sessionMatch } = await supabase
      .from('customers')
      .select('*')
      .contains('preferences', { session_id: requestData.sessionId });
    if (sessionMatch && sessionMatch.length > 0) {
      for (const account of sessionMatch){
        if (!accounts.find((a)=>a.id === account.id)) {
          accounts.push(account);
        }
      }
    }
  }
  return accounts;
}
async function createNewAccount(supabase, requestData) {
  // Create new customer with enhanced profile tracking
  const newCustomer = {
    email: requestData.email || `chatbot_${Date.now()}@temp.local`,
    phone: requestData.phone || null,
    first_name: requestData.firstName || null,
    last_name: requestData.lastName || null,
    allergies: requestData.allergies || [],
    dietary_restrictions: requestData.dietaryRestrictions || [],
    preferences: {
      account_sources: [
        requestData.source
      ],
      created_via: requestData.source,
      last_updated_via: requestData.source,
      // Store session ID for anonymous user tracking
      session_id: requestData.sessionId || null,
      // Enhanced profile information
      preferred_contact_method: requestData.preferredContactMethod || 'phone',
      preferred_delivery_time: requestData.preferredDeliveryTime || null,
      birthday: requestData.birthday || null,
      anniversary: requestData.anniversary || null,
      occupation: requestData.occupation || null,
      household_size: requestData.householdSize || null,
      special_occasions: requestData.specialOccasions || [],
      communication_preferences: {
        order_reminders: requestData.orderReminders !== false,
        promotional_offers: requestData.promotionalOffers !== false,
        holiday_specials: requestData.holidaySpecials !== false
      }
    },
    auth_user_id: requestData.authUserId || null
  };
  const { data: createdCustomer, error: createError } = await supabase.from('customers').insert(newCustomer).select().single();
  if (createError) {
    throw new Error(`Failed to create customer: ${createError.message}`);
  }
  // Create chatbot flat record
  await createChatbotFlatRecord(supabase, createdCustomer);
  const response = {
    customer: {
      id: createdCustomer.id,
      email: createdCustomer.email,
      phone: createdCustomer.phone,
      firstName: createdCustomer.first_name,
      lastName: createdCustomer.last_name,
      name: [
        createdCustomer.first_name,
        createdCustomer.last_name
      ].filter(Boolean).join(' ') || 'Valued Customer',
      allergies: createdCustomer.allergies,
      isNewAccount: true,
      accountSources: [
        requestData.source
      ],
      _internalId: createdCustomer.id
    },
    orderHistory: [],
    summary: `Welcome! I've created your new account via ${requestData.source}. Ready to place your first order?`
  };
  return new Response(JSON.stringify(response), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
async function updateExistingAccount(supabase, existingAccount, requestData) {
  // Merge new data with existing account
  const updatedData = {};
  let hasUpdates = false;
  // Update missing fields
  if (requestData.phone && !existingAccount.phone) {
    updatedData.phone = requestData.phone;
    hasUpdates = true;
  }
  if (requestData.email && requestData.email.trim() !== '') {
    // Update email if current email is temporary OR if no email exists
    if (!existingAccount.email || existingAccount.email.includes('@temp.local')) {
      updatedData.email = requestData.email;
      hasUpdates = true;
    }
  }
  if (requestData.firstName && !existingAccount.first_name) {
    updatedData.first_name = requestData.firstName;
    hasUpdates = true;
  }
  if (requestData.lastName && !existingAccount.last_name) {
    updatedData.last_name = requestData.lastName;
    hasUpdates = true;
  }
  
  // Update enhanced profile fields (only if not already set)
  const currentPrefs = existingAccount.preferences || {};
  const updatedPrefs = { ...currentPrefs };
  
  if (requestData.dietaryRestrictions && requestData.dietaryRestrictions.length > 0 && (!existingAccount.dietary_restrictions || existingAccount.dietary_restrictions.length === 0)) {
    updatedData.dietary_restrictions = requestData.dietaryRestrictions;
    hasUpdates = true;
  }
  
  if (requestData.allergies && requestData.allergies.length > 0 && (!existingAccount.allergies || existingAccount.allergies.length === 0)) {
    updatedData.allergies = requestData.allergies;
    hasUpdates = true;
  }
  
  // Update preferences with new profile information
  if (requestData.preferredContactMethod && !currentPrefs.preferred_contact_method) {
    updatedPrefs.preferred_contact_method = requestData.preferredContactMethod;
    hasUpdates = true;
  }
  
  if (requestData.preferredDeliveryTime && !currentPrefs.preferred_delivery_time) {
    updatedPrefs.preferred_delivery_time = requestData.preferredDeliveryTime;
    hasUpdates = true;
  }
  
  if (requestData.birthday && !currentPrefs.birthday) {
    updatedPrefs.birthday = requestData.birthday;
    hasUpdates = true;
  }
  
  if (requestData.anniversary && !currentPrefs.anniversary) {
    updatedPrefs.anniversary = requestData.anniversary;
    hasUpdates = true;
  }
  
  if (requestData.occupation && !currentPrefs.occupation) {
    updatedPrefs.occupation = requestData.occupation;
    hasUpdates = true;
  }
  
  if (requestData.householdSize && !currentPrefs.household_size) {
    updatedPrefs.household_size = requestData.householdSize;
    hasUpdates = true;
  }
  
  // Update source tracking
  const currentSources = currentPrefs.account_sources || [];
  let prefsUpdated = false;
  if (!currentSources.includes(requestData.source)) {
    updatedPrefs.account_sources = [...currentSources, requestData.source];
    updatedPrefs.last_updated_via = requestData.source;
    prefsUpdated = true;
    hasUpdates = true;
  }
  
  // Update preferences if anything changed
  if (prefsUpdated || Object.keys(updatedPrefs).length !== Object.keys(currentPrefs).length) {
    updatedData.preferences = updatedPrefs;
  }
  // Apply updates if any
  if (hasUpdates) {
    console.log('Updating customer with data:', JSON.stringify(updatedData, null, 2));
    const { error: updateError } = await supabase.from('customers').update(updatedData).eq('id', existingAccount.id);
    if (updateError) {
      console.error('Customer update error:', updateError);
    } else {
      console.log('Customer update successful');
    }
  } else {
    console.log('No updates needed for customer:', existingAccount.id);
  }
  // Get order history
  const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', existingAccount.id).order('created_at', {
    ascending: false
  }).limit(5);
  const accountSources = updatedData.preferences?.account_sources || currentSources;
  const response = {
    customer: {
      id: existingAccount.id,
      email: updatedData.email || existingAccount.email,
      phone: updatedData.phone || existingAccount.phone,
      firstName: updatedData.first_name || existingAccount.first_name,
      lastName: updatedData.last_name || existingAccount.last_name,
      name: [
        updatedData.first_name || existingAccount.first_name,
        updatedData.last_name || existingAccount.last_name
      ].filter(Boolean).join(' ') || 'Valued Customer',
      allergies: existingAccount.allergies,
      isNewAccount: false,
      accountSources: accountSources,
      _internalId: existingAccount.id
    },
    orderHistory: orders || [],
    summary: generateWelcomeMessage(existingAccount, requestData.source, orders?.length || 0)
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
async function handleDuplicateAccounts(supabase, accounts, requestData) {
  // Enhanced: Try automatic merging for multiple scenarios
  try {
    let compatibilityCheck = null;
    let mergeAttempted = false;

    // Scenario 1: Both phone and email provided (traditional merge)
    if (requestData.phone && requestData.email && accounts.length === 2) {
      const { data: emailPhoneCheck, error: compatibilityError } = await supabase.rpc('check_merge_compatibility', {
        p_phone: requestData.phone,
        p_email: requestData.email
      });

      if (!compatibilityError && emailPhoneCheck?.can_merge) {
        compatibilityCheck = emailPhoneCheck;
        mergeAttempted = true;
      }
    }

    // Scenario 2: Phone number duplicates (including temp emails) - NEW!
    if (!mergeAttempted && requestData.phone) {
      const { data: phoneCheck, error: phoneError } = await supabase.rpc('detect_phone_duplicates', {
        p_phone: requestData.phone
      });

      if (!phoneError && phoneCheck?.can_auto_merge) {
        // Convert phone duplicate check to compatibility format
        compatibilityCheck = {
          can_merge: true,
          merge_type: 'phone_consolidation',
          primary_account: phoneCheck.primary_account,
          total_accounts: phoneCheck.total_accounts,
          temp_accounts: phoneCheck.temp_accounts
        };
        mergeAttempted = true;
      }
    }

    // Perform merge if compatible scenario found
    if (compatibilityCheck?.can_merge) {
      const { data: mergeResult, error: mergeError } = await supabase.rpc('merge_customer_accounts', {
        p_phone: requestData.phone,
        p_email: requestData.email || null,
        p_source: requestData.source || 'automatic'
      });

      if (mergeError) {
        console.error('Merge error:', mergeError);
      } else if (mergeResult?.success) {
        // Merge successful - return the unified account
        const { data: unifiedCustomer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', mergeResult.primary_account_id)
          .single();

        if (!customerError && unifiedCustomer) {
          // Get order history for the unified account
          const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', unifiedCustomer.id)
            .order('created_at', { ascending: false })
            .limit(5);

          const accountSources = unifiedCustomer.preferences?.account_sources || ['phone', 'webapp'];
          
          // Enhanced response based on merge type
          let summaryMessage;
          if (mergeResult.merge_type === 'phone_consolidation') {
            summaryMessage = `Welcome back! I've consolidated ${mergeResult.consolidated_accounts} duplicate phone accounts. ${mergeResult.total_orders > 0 ? `You now have ${mergeResult.total_orders} orders in your complete history.` : 'Ready to place your first order?'}`;
          } else {
            summaryMessage = `Welcome back! I've unified your accounts. ${mergeResult.total_orders > 0 ? `You now have ${mergeResult.total_orders} orders in your complete history.` : 'Ready to place your first order?'}`;
          }
          
          const response = {
            customer: {
              id: unifiedCustomer.id,
              email: unifiedCustomer.email,
              phone: unifiedCustomer.phone,
              firstName: unifiedCustomer.first_name,
              lastName: unifiedCustomer.last_name,
              name: [unifiedCustomer.first_name, unifiedCustomer.last_name].filter(Boolean).join(' ') || 'Valued Customer',
              allergies: unifiedCustomer.allergies || [],
              dietaryRestrictions: unifiedCustomer.dietary_restrictions || [],
              isNewAccount: false,
              accountSources: accountSources,
              _internalId: unifiedCustomer.id
            },
            orderHistory: orders || [],
            mergeResults: {
              merged: true,
              mergeType: mergeResult.merge_type,
              strategy: mergeResult.merge_strategy || 'consolidation',
              ordersTransferred: mergeResult.orders_transferred || 0,
              totalOrders: mergeResult.total_orders || 0,
              consolidatedAccounts: mergeResult.consolidated_accounts || 1
            },
            summary: summaryMessage
          };

          return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Enhanced account merge process error:', error);
  }

  // Fall back to conflict handling if merge is not possible or failed
  const response = {
    customer: {
      id: accounts[0].id,
      email: accounts[0].email,
      phone: accounts[0].phone,
      firstName: accounts[0].first_name,
      lastName: accounts[0].last_name,
      name: [
        accounts[0].first_name,
        accounts[0].last_name
      ].filter(Boolean).join(' ') || 'Valued Customer',
      allergies: accounts[0].allergies,
      isNewAccount: false,
      accountSources: [
        'multiple'
      ],
      _internalId: accounts[0].id
    },
    orderHistory: [],
    summary: "I found multiple accounts that might be yours. Let me help you access the right one.",
    conflicts: {
      found: true,
      details: `Found ${accounts.length} accounts with matching information`,
      suggestedActions: [
        "Verify your primary email address",
        "Confirm your phone number",
        "Contact support to merge accounts if needed"
      ]
    }
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
async function createChatbotFlatRecord(supabase, customer) {
  const customerData = {
    customer_info: {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      allergies: customer.allergies
    },
    order_history: [],
    account_sources: customer.preferences?.account_sources || []
  };
  await supabase.from('chatbot_customers_flat').insert({
    customer_id: customer.id,
    customer_data: customerData
  });
}
function generateWelcomeMessage(customer, source, orderCount) {
  const firstName = customer.first_name;
  const sourceText = source === 'chatbot' ? 'voice assistant' : 'website';
  if (orderCount === 0) {
    return firstName ? `Hi ${firstName}! Welcome back via ${sourceText}. Ready to place your first order?` : `Welcome back via ${sourceText}! Ready to place your first order?`;
  } else {
    return firstName ? `Welcome back ${firstName}! I see you have ${orderCount} previous orders. What can I help you with today?` : `Welcome back! I see you have ${orderCount} previous orders. What can I help you with today?`;
  }
}
