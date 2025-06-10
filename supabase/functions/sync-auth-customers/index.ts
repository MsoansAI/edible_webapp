import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface SyncResult {
  linked: number
  created: number
  updated: number
  errors: Array<{ authUserId: string, error: string }>
  summary: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (req.method === 'POST') {
      const { mode = 'manual', targetEmail } = await req.json()
      
      if (mode === 'single' && targetEmail) {
        // Sync a single user by email
        const result = await syncSingleUserByEmail(supabase, targetEmail)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // Sync all auth users
        const result = await syncAllAuthUsers(supabase)
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (req.method === 'GET') {
      // Get sync status/preview
      const preview = await getSyncPreview(supabase)
      return new Response(JSON.stringify(preview), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sync function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Sync failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function syncAllAuthUsers(supabase): Promise<SyncResult> {
  const result: SyncResult = {
    linked: 0,
    created: 0,
    updated: 0,
    errors: [],
    summary: ''
  }

  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    console.log(`Processing ${authUsers.users.length} auth users...`)

    for (const authUser of authUsers.users) {
      if (!authUser.email) {
        console.log(`Skipping auth user ${authUser.id} - no email`)
        continue
      }

      try {
        const syncResult = await syncSingleAuthUser(supabase, authUser)
        
        if (syncResult.action === 'linked') result.linked++
        else if (syncResult.action === 'created') result.created++
        else if (syncResult.action === 'updated') result.updated++
        
      } catch (error) {
        console.error(`Error syncing auth user ${authUser.id}:`, error)
        result.errors.push({
          authUserId: authUser.id,
          error: error.message
        })
      }
    }

    result.summary = `Sync completed: ${result.linked} linked, ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`
    console.log(result.summary)
    
    return result

  } catch (error) {
    throw new Error(`Sync all users failed: ${error.message}`)
  }
}

async function syncSingleUserByEmail(supabase, email: string) {
  // Get auth user by email
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    throw new Error(`Failed to fetch auth users: ${authError.message}`)
  }

  const authUser = authUsers.users.find(user => user.email === email)
  
  if (!authUser) {
    return { 
      error: 'Auth user not found',
      message: `No authenticated user found with email: ${email}`
    }
  }

  const syncResult = await syncSingleAuthUser(supabase, authUser)
  
  return {
    authUserId: authUser.id,
    email: authUser.email,
    action: syncResult.action,
    customerRecord: syncResult.customerRecord,
    message: syncResult.message
  }
}

async function syncSingleAuthUser(supabase, authUser) {
  const { id: authUserId, email, user_metadata } = authUser
  
  // Extract name info from auth metadata
  const authFirstName = user_metadata?.first_name || user_metadata?.firstName || ''
  const authLastName = user_metadata?.last_name || user_metadata?.lastName || ''
  const authPhone = user_metadata?.phone || user_metadata?.phone_number || null

  console.log(`Syncing auth user: ${email} (${authUserId})`)

  // Check if customer record already linked to this auth user
  let { data: existingCustomer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (customerError && customerError.code !== 'PGRST116') {
    throw new Error(`Database error: ${customerError.message}`)
  }

  if (existingCustomer) {
    // Customer already linked - update with auth data
    const updatedData = await updateCustomerWithAuthData(
      supabase, 
      existingCustomer, 
      { email, authFirstName, authLastName, authPhone, authUserId }
    )
    
    return {
      action: 'updated',
      customerRecord: updatedData,
      message: `Updated existing linked customer record`
    }
  }

  // No linked customer found - look for unlinked customer with same email
  const { data: emailMatch, error: emailError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .is('auth_user_id', null) // Only unlinked customers
    .single()

  if (emailError && emailError.code !== 'PGRST116') {
    throw new Error(`Email lookup error: ${emailError.message}`)
  }

  if (emailMatch) {
    // Found unlinked customer with matching email - link and update
    const linkedData = await linkAndUpdateCustomer(
      supabase,
      emailMatch,
      { email, authFirstName, authLastName, authPhone, authUserId }
    )
    
    return {
      action: 'linked',
      customerRecord: linkedData,
      message: `Linked existing customer record via email match`
    }
  }

  // No matching customer found - create new customer record
  const newCustomer = await createCustomerFromAuth(
    supabase,
    { email, authFirstName, authLastName, authPhone, authUserId }
  )

  return {
    action: 'created',
    customerRecord: newCustomer,
    message: `Created new customer record from auth user`
  }
}

async function updateCustomerWithAuthData(supabase, existingCustomer, authData) {
  const { email, authFirstName, authLastName, authPhone, authUserId } = authData
  
  // Auth data takes precedence, but preserve customer data that doesn't exist in auth
  const updates = {
    email: email, // Auth email always takes precedence
    first_name: authFirstName || existingCustomer.first_name, // Auth name if available
    last_name: authLastName || existingCustomer.last_name,
    phone: authPhone || existingCustomer.phone, // Keep existing phone if auth doesn't have it
    auth_user_id: authUserId, // Ensure linkage
    
    // Update preferences to track sync
    preferences: {
      ...existingCustomer.preferences,
      account_sources: Array.from(new Set([
        ...(existingCustomer.preferences?.account_sources || []),
        'webapp'
      ])),
      last_auth_sync: new Date().toISOString(),
      sync_source: 'auth_override'
    }
  }

  const { data: updatedCustomer, error: updateError } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', existingCustomer.id)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(`Failed to update customer: ${updateError.message}`)
  }

  console.log(`Updated customer ${existingCustomer.id} with auth data`)
  return updatedCustomer
}

async function linkAndUpdateCustomer(supabase, customer, authData) {
  const { email, authFirstName, authLastName, authPhone, authUserId } = authData
  
  // Link customer and update with auth data (auth takes precedence)
  const updates = {
    auth_user_id: authUserId, // Link to auth user
    email: email, // Auth email takes precedence
    first_name: authFirstName || customer.first_name,
    last_name: authLastName || customer.last_name,
    phone: authPhone || customer.phone,
    
    // Preserve existing customer data and track the linking
    preferences: {
      ...customer.preferences,
      account_sources: Array.from(new Set([
        ...(customer.preferences?.account_sources || []),
        'webapp'
      ])),
      linked_at: new Date().toISOString(),
      linked_from: 'email_match',
      auth_override: true
    }
  }

  const { data: linkedCustomer, error: linkError } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customer.id)
    .select('*')
    .single()

  if (linkError) {
    throw new Error(`Failed to link customer: ${linkError.message}`)
  }

  console.log(`Linked customer ${customer.id} to auth user ${authUserId}`)
  return linkedCustomer
}

async function createCustomerFromAuth(supabase, authData) {
  const { email, authFirstName, authLastName, authPhone, authUserId } = authData
  
  const newCustomer = {
    auth_user_id: authUserId,
    email: email,
    first_name: authFirstName,
    last_name: authLastName,
    phone: authPhone,
    allergies: [],
    dietary_restrictions: [],
    preferences: {
      account_sources: ['webapp'],
      created_from: 'auth_sync',
      created_at: new Date().toISOString()
    }
  }

  const { data: createdCustomer, error: createError } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select('*')
    .single()

  if (createError) {
    throw new Error(`Failed to create customer: ${createError.message}`)
  }

  console.log(`Created new customer ${createdCustomer.id} from auth user ${authUserId}`)
  return createdCustomer
}

async function getSyncPreview(supabase) {
  try {
    // Get auth users count
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    // Get customer stats
    const { data: customerStats, error: customerError } = await supabase
      .from('customers')
      .select('id, auth_user_id, email')

    if (customerError) {
      throw new Error(`Failed to fetch customers: ${customerError.message}`)
    }

    const linkedCustomers = customerStats.filter(c => c.auth_user_id)
    const unlinkedCustomers = customerStats.filter(c => !c.auth_user_id)
    
    // Find potential matches
    const authEmails = new Set(authUsers.users.map(u => u.email).filter(Boolean))
    const potentialMatches = unlinkedCustomers.filter(c => 
      c.email && authEmails.has(c.email)
    )

    return {
      authUsers: {
        total: authUsers.users.length,
        withEmail: authUsers.users.filter(u => u.email).length
      },
      customers: {
        total: customerStats.length,
        linked: linkedCustomers.length,
        unlinked: unlinkedCustomers.length,
        phoneOnly: unlinkedCustomers.filter(c => c.phone && !c.email?.includes('@temp.local')).length
      },
      sync: {
        potentialMatches: potentialMatches.length,
        matchEmails: potentialMatches.map(c => c.email)
      },
      recommendation: potentialMatches.length > 0 
        ? `Found ${potentialMatches.length} customers that can be linked to auth users`
        : 'All eligible customers are already synced'
    }

  } catch (error) {
    throw new Error(`Preview failed: ${error.message}`)
  }
} 