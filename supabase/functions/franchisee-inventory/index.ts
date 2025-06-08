import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type RateLimitEndpoint = 'product-search' | 'customer-management' | 'franchisee-inventory' | 'create-order';

// Rate limiting configuration
const RATE_LIMITS: Record<RateLimitEndpoint, { requests: number, window: number }> = {
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
async function checkRateLimit(supabase: SupabaseClient, identifier: string, endpoint: RateLimitEndpoint): Promise<boolean> {
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
// Get client identifier (IP address or user ID)
function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = req.headers.get('x-client-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) return realIp;
  if (clientIp) return clientIp;
  // Fallback to a default identifier
  return 'unknown-client';
}
Deno.serve(async (req: Request)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(supabase, clientId, 'franchisee-inventory');
    if (!isAllowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many store finder requests. Please wait a moment and try again.',
        retryAfter: 60
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '60'
        }
      });
    }
    const url = new URL(req.url);
    // Route based on endpoint
    if (url.pathname.endsWith('/find-nearest')) {
      return await handleFindNearest(supabase, req);
    } else {
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        available: [
          '/find-nearest'
        ]
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('Franchisee inventory error:', error);
    return new Response(JSON.stringify({
      error: 'Service error',
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
async function handleFindNearest(supabase: SupabaseClient, req: Request) {
  try {
    let requestData;
    if (req.method === 'GET') {
      // Support GET with query parameters
      const url = new URL(req.url);
      const zipCode = url.searchParams.get('zipCode');
      if (!zipCode) {
        return new Response(JSON.stringify({
          error: 'Missing zipCode parameter'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      requestData = {
        zipCode,
        productId: url.searchParams.get('productId') || undefined,
        radius: url.searchParams.get('radius') ? parseFloat(url.searchParams.get('radius')) : undefined
      };
    } else {
      requestData = await req.json();
    }
    if (!requestData.zipCode) {
      return new Response(JSON.stringify({
        error: 'zipCode is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    // Find franchisee that serves this zip code
    const { data: deliveryZone, error: zoneError } = await supabase.from('delivery_zones').select('*, franchisees!franchisee_id(*)').contains('zip_codes', [
      requestData.zipCode
    ]).single();
    if (zoneError || !deliveryZone) {
      // Fallback: find nearest franchisee by looking up in flat data
      const { data: franchiseeData, error: franchiseeError } = await supabase.from('chatbot_franchisees_flat').select('*').limit(1).single();
      if (franchiseeError || !franchiseeData) {
        return new Response(JSON.stringify({
          error: 'No delivery available',
          summary: `Sorry, we don't currently deliver to ${requestData.zipCode}. Please try a nearby zip code or consider pickup.`
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      // Return pickup-only store
      const response = {
        store: streamlineStore(franchiseeData, null, false),
        summary: `Found your nearest store for pickup in ${requestData.zipCode}. Delivery not available to this area.`
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    // Check product availability if specified
    if (requestData.productId) {
      const { data: inventory, error: invError } = await supabase.from('inventory').select('quantity_available').eq('franchisee_id', deliveryZone.franchisee_id).eq('product_id', requestData.productId).gt('quantity_available', 0).single();
      if (invError || !inventory) {
        return new Response(JSON.stringify({
          error: 'Product not available',
          summary: `Sorry, that product is currently out of stock at your local store. Try browsing other options.`
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    const response = {
      store: streamlineStore(deliveryZone.franchisees, deliveryZone, true),
      summary: `Perfect! I found your local store with delivery available to ${requestData.zipCode}.`
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('Find nearest error:', error);
    throw error;
  }
}
function streamlineStore(franchisee: any, deliveryZone: any = null, deliveryAvailable: boolean = false) {
  // Handle both direct franchisee data and flat data structure
  const storeData = franchisee.franchisee_data || franchisee;
  const storeInfo = storeData.franchisee_info || storeData;
  // Format address as single line
  const addressParts = [
    storeInfo.address,
    storeInfo.city,
    storeInfo.state
  ].filter(Boolean);
  const formattedAddress = addressParts.join(', ');
  // Get today's hours
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long'
  });
  const operatingHours = storeInfo.operating_hours || {};
  const todaysHours = operatingHours[today] || operatingHours.default || {
    open: '9:00',
    close: '18:00',
    closed: false
  };
  let todaysHoursString = 'Closed';
  if (!todaysHours.closed) {
    todaysHoursString = `${formatTime(todaysHours.open)} - ${formatTime(todaysHours.close)}`;
  }
  // Get tomorrow's hours for planning
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long'
  });
  const tomorrowHours = operatingHours[tomorrowDay] || operatingHours.default || {
    open: '9:00',
    close: '18:00',
    closed: false
  };
  let tomorrowHoursString;
  if (!tomorrowHours.closed) {
    tomorrowHoursString = `${formatTime(tomorrowHours.open)} - ${formatTime(tomorrowHours.close)}`;
  }
  // Delivery information
  const deliveryInfo = {
    available: deliveryAvailable,
    fee: deliveryZone?.delivery_fee ? `$${parseFloat(deliveryZone.delivery_fee).toFixed(2)}` : undefined,
    minimumOrder: deliveryZone?.min_order_amount ? `$${parseFloat(deliveryZone.min_order_amount).toFixed(2)}` : undefined,
    estimatedTime: deliveryAvailable ? '30-45 minutes' : undefined
  };
  // Handle free delivery
  if (deliveryInfo.fee === '$0.00') {
    deliveryInfo.fee = 'Free';
  }
  return {
    name: storeInfo.name || 'Edible Arrangements',
    address: formattedAddress,
    phone: storeInfo.phone || '',
    hours: {
      today: todaysHoursString,
      tomorrow: tomorrowHoursString
    },
    delivery: deliveryInfo,
    _internalId: franchisee.id || franchisee.franchisee_id
  };
}
function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '';
  // Handle various time formats (24hr, 12hr, etc)
  const time = timeString.includes(':') ? timeString : `${timeString}:00`;
  try {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const minute = parseInt(minutes) || 0;
    if (hour24 === 0) {
      return `12:${minute.toString().padStart(2, '0')} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${minute.toString().padStart(2, '0')} AM`;
    } else if (hour24 === 12) {
      return `12:${minute.toString().padStart(2, '0')} PM`;
    } else {
      return `${hour24 - 12}:${minute.toString().padStart(2, '0')} PM`;
    }
  } catch (error: any) {
    return timeString || ''; // Return original if parsing fails
  }
} 