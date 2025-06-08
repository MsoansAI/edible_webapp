import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main Deno serve function
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication error', details: userError.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // GET: Retrieve user profile
    if (req.method === 'GET') {
      const { data: profile, error: profileError } = await supabase
        .from('customers') // Assuming profiles are in 'customers' table
        .select(`
          first_name,
          last_name,
          email,
          phone,
          preferences,
          allergies,
          dietary_restrictions
        `)
        .eq('auth_user_id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') { // Ignore no row found error
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profile) {
        // If no profile, maybe create a basic one from auth data?
        // For now, return what we have from auth.
        return new Response(JSON.stringify({
            email: user.email,
            phone: user.phone,
            // Indicate that a full profile is missing
            profile_status: 'not_created' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(profile), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH: Update user profile
    if (req.method === 'PATCH') {
      const updates = await req.json();

      // Simple validation: ensure updates is an object
      if (typeof updates !== 'object' || updates === null) {
          return new Response(JSON.stringify({ error: 'Invalid update data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }

      const { data, error: updateError } = await supabase
        .from('customers')
        .update(updates)
        .eq('auth_user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Provide more detailed error response
        if (updateError.code === '23505') { // unique_violation
            return new Response(JSON.stringify({ error: 'Update failed', details: 'A user with these details (e.g., email or phone) might already exist.' }), {
              status: 409, // Conflict
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        throw updateError;
      }
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('User profile function error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
