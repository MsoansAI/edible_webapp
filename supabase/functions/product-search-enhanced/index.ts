import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limiting configuration
const RATE_LIMITS = {
  'product-search': { requests: 30, window: 60 }, // 30 requests per minute
  'customer-management': { requests: 20, window: 60 }, // 20 requests per minute
  'franchisee-inventory': { requests: 15, window: 60 }, // 15 requests per minute
  'create-order': { requests: 10, window: 60 } // 10 orders per minute
};

interface SearchRequest {
  // Flexible search options
  query?: string;              // Natural language search
  productId?: string;          // Direct 4-digit ID lookup
  category?: string;           // Occasion/category filter
  maxPrice?: number;           // Price filtering
  minPrice?: number;
  allergens?: string[];        // Customer allergies to avoid
  franchiseeId?: string;       // Check availability at specific store
  occasion?: string;           // Special occasion context
  recipient?: string;          // Who it's for (optional context)
  priceRange?: string;         // "budget" (<$50), "mid" ($50-100), "premium" (>$100)
  semanticThreshold?: number;  // NEW: Minimum similarity score for semantic search (0-1)
  semanticBoost?: boolean;     // NEW: Force semantic search even with structured results
  maxResults?: number;         // NEW: Maximum number of results to return
}

interface StreamlinedProduct {
  productId: string;           // 4-digit customer-friendly ID
  name: string;
  price: string;               // Formatted as "$49.99"
  description: string;         // Brief, customer-friendly description
  options?: {
    name: string;
    price: string;
    _internalId?: string;      // Hidden from customer, for API calls
  }[];
  allergens: string[];         // Safety information
  availableAddons?: string[];  // Simple "Name ($price)" format
  semanticScore?: number;      // NEW: Similarity score for semantic matches
  _internalId: string;         // Hidden from customer, for API calls
}

interface StreamlinedResponse {
  products: StreamlinedProduct[];
  count: number;
  summary: string;             // Human-readable search summary
  searchMethod?: string;       // For debugging only
  semanticSearchUsed?: boolean; // NEW: Whether semantic search was used
  structuredResultCount?: number; // NEW: How many results from structured search
}

// Rate limiting function
async function checkRateLimit(supabase: any, identifier: string, endpoint: string): Promise<boolean> {
  try {
    const limit = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS];
    if (!limit) return true; // No limit configured
    
    const windowStart = new Date();
    windowStart.setSeconds(windowStart.getSeconds() - limit.window);
    
    // Clean up old entries
    await supabase
      .from('api_rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());
    
    // Check current usage
    const { data: currentUsage, error } = await supabase
      .from('api_rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return true; // Allow request if rate limit check fails
    }
    
    if (currentUsage) {
      // Update existing record
      if (currentUsage.request_count >= limit.requests) {
        return false; // Rate limit exceeded
      }
      
      await supabase
        .from('api_rate_limits')
        .update({ 
          request_count: currentUsage.request_count + 1,
          created_at: new Date().toISOString()
        })
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString());
    } else {
      // Create new record
      await supabase
        .from('api_rate_limits')
        .insert({
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

// NEW: Generate embedding for search query using OpenAI
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey || !query.trim()) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [query.trim()],
        model: 'text-embedding-ada-002',
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;
    
    if (Array.isArray(embedding) && embedding.length === 1536) {
      return embedding;
    } else {
      console.error('Invalid embedding dimensions:', embedding?.length);
      return null;
    }
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
}

// NEW: Perform semantic search using vector similarity
async function performSemanticSearch(
  supabase: any, 
  searchData: SearchRequest,
  maxResults: number = 10
): Promise<{ products: any[], semanticScores: number[] }> {
  
  if (!searchData.query) {
    return { products: [], semanticScores: [] };
  }

  // Generate embedding for the search query
  const queryEmbedding = await generateQueryEmbedding(searchData.query);
  
  if (!queryEmbedding) {
    console.log('Could not generate embedding for query, falling back to structured search');
    return { products: [], semanticScores: [] };
  }

  console.log(`Generated embedding for query: "${searchData.query}"`);

  try {
    // Use pgvector similarity search with cosine distance
    const similarityThreshold = searchData.semanticThreshold || 0.7; // Default similarity threshold
    
    // Build the semantic search query
    let semanticQuery = supabase
      .from('chatbot_products_flat')
      .select(`
        *,
        products!inner(embedding)
      `)
      .not('products.embedding', 'is', null); // Only products with embeddings

    // Apply filters while doing semantic search
    if (searchData.maxPrice) {
      semanticQuery = semanticQuery.lte('product_data->product_info->>base_price', searchData.maxPrice);
    }
    if (searchData.minPrice) {
      semanticQuery = semanticQuery.gte('product_data->product_info->>base_price', searchData.minPrice);
    }
    
    // Price range filtering
    if (searchData.priceRange) {
      switch (searchData.priceRange.toLowerCase()) {
        case 'budget':
          semanticQuery = semanticQuery.lte('product_data->product_info->>base_price', 50);
          break;
        case 'mid':
        case 'medium':
          semanticQuery = semanticQuery.gte('product_data->product_info->>base_price', 50)
                          .lte('product_data->product_info->>base_price', 100);
          break;
        case 'premium':
        case 'luxury':
          semanticQuery = semanticQuery.gte('product_data->product_info->>base_price', 100);
          break;
      }
    }

    // Category filtering
    if (searchData.category || searchData.occasion) {
      const categoryTerm = searchData.category || searchData.occasion;
      semanticQuery = semanticQuery.or(
        `product_data->categories.cs.[{"name": "${categoryTerm}"}],` +
        `product_data->categories.cs.[{"name": "${categoryTerm.toLowerCase()}"}],` +
        `product_data->categories.cs.[{"name": "${categoryTerm.charAt(0).toUpperCase() + categoryTerm.slice(1)}"}]`
      );
    }

    const { data: candidateProducts, error: semanticError } = await semanticQuery.limit(50); // Get more candidates for similarity calc

    if (semanticError) {
      console.error('Semantic search query error:', semanticError);
      return { products: [], semanticScores: [] };
    }

    if (!candidateProducts || candidateProducts.length === 0) {
      console.log('No candidate products found for semantic search');
      return { products: [], semanticScores: [] };
    }

    // Calculate cosine similarity for each candidate
    const productsWithScores = candidateProducts
      .map(product => {
        const productEmbedding = product.products.embedding;
        
        if (!productEmbedding || !Array.isArray(productEmbedding) || productEmbedding.length !== 1536) {
          return null;
        }

        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, productEmbedding);
        
        return {
          product,
          similarity
        };
      })
      .filter(item => item !== null && item.similarity >= similarityThreshold) // Filter by threshold
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, maxResults); // Limit results

    const products = productsWithScores.map(item => item.product);
    const semanticScores = productsWithScores.map(item => item.similarity);

    console.log(`Semantic search found ${products.length} products above threshold ${similarityThreshold}`);
    
    return { products, semanticScores };

  } catch (error) {
    console.error('Semantic search error:', error);
    return { products: [], semanticScores: [] };
  }
}

// NEW: Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }
  
  return dotProduct / denominator;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(supabase, clientId, 'product-search');
    
    if (!isAllowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded', 
        message: 'Too many product searches. Please wait a moment and try again.',
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

    let searchData: SearchRequest;
    
    if (req.method === 'GET') {
      // Support GET requests with query parameters
      const url = new URL(req.url);
      searchData = {
        query: url.searchParams.get('query') || undefined,
        productId: url.searchParams.get('productId') || url.searchParams.get('id') || undefined,
        category: url.searchParams.get('category') || undefined,
        maxPrice: url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined,
        minPrice: url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined,
        allergens: url.searchParams.get('allergens')?.split(',') || undefined,
        franchiseeId: url.searchParams.get('franchiseeId') || undefined,
        occasion: url.searchParams.get('occasion') || undefined,
        priceRange: url.searchParams.get('priceRange') || undefined,
        semanticThreshold: url.searchParams.get('semanticThreshold') ? parseFloat(url.searchParams.get('semanticThreshold')!) : undefined,
        semanticBoost: url.searchParams.get('semanticBoost') === 'true',
        maxResults: url.searchParams.get('maxResults') ? parseInt(url.searchParams.get('maxResults')!) : undefined
      };
    } else {
      searchData = await req.json();
    }

    const maxResults = searchData.maxResults || 10;
    let searchMethod = 'structured';
    let semanticSearchUsed = false;
    let structuredResultCount = 0;

    // LEVEL 1: Direct lookup by 4-digit product identifier (fastest)
    if (searchData.productId) {
      const productIdentifier = parseInt(searchData.productId);
      if (!isNaN(productIdentifier)) {
        const { data: product, error } = await supabase
          .from('chatbot_products_flat')
          .select('*')
          .eq('product_data->product_info->>product_identifier', productIdentifier)
          .single();

        if (!error && product) {
          searchMethod = 'direct_id';
          const streamlinedProduct = streamlineProduct(product);
          return new Response(JSON.stringify({
            products: [streamlinedProduct],
            count: 1,
            summary: `Found ${streamlinedProduct.name}`,
            searchMethod,
            semanticSearchUsed: false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      }
    }

    // LEVEL 2: Structured search with filters
    let structuredProducts: any[] = [];
    
    if (!searchData.semanticBoost) { // Skip structured search if semantic boost is requested
      let query = supabase.from('chatbot_products_flat').select('*');

      // Text search in product name and description
      if (searchData.query) {
        query = query.or(
          `product_data->product_info->>name.ilike.%${searchData.query}%,` +
          `product_data->product_info->>description.ilike.%${searchData.query}%`
        );
      }

      // Category filtering (exact match or partial)
      if (searchData.category || searchData.occasion) {
        const categoryTerm = searchData.category || searchData.occasion;
        query = query.or(
          `product_data->categories.cs.[{"name": "${categoryTerm}"}],` +
          `product_data->categories.cs.[{"name": "${categoryTerm.toLowerCase()}"}],` +
          `product_data->categories.cs.[{"name": "${categoryTerm.charAt(0).toUpperCase() + categoryTerm.slice(1)}"}]`
        );
      }

      // Price range filtering
      if (searchData.priceRange) {
        switch (searchData.priceRange.toLowerCase()) {
          case 'budget':
            query = query.lte('product_data->product_info->>base_price', 50);
            break;
          case 'mid':
          case 'medium':
            query = query.gte('product_data->product_info->>base_price', 50)
                        .lte('product_data->product_info->>base_price', 100);
            break;
          case 'premium':
          case 'luxury':
            query = query.gte('product_data->product_info->>base_price', 100);
            break;
        }
      }

      // Specific price range
      if (searchData.maxPrice) {
        query = query.lte('product_data->product_info->>base_price', searchData.maxPrice);
      }
      if (searchData.minPrice) {
        query = query.gte('product_data->product_info->>base_price', searchData.minPrice);
      }

      const { data: products, error } = await query.limit(maxResults);

      if (!error && products) {
        structuredProducts = products;
        structuredResultCount = structuredProducts.length;
      }
    }

    // LEVEL 3: Semantic search fallback or boost
    let semanticProducts: any[] = [];
    let semanticScores: number[] = [];
    
    const shouldUseSemanticSearch = 
      searchData.semanticBoost || // Explicitly requested
      (searchData.query && structuredProducts.length < 3) || // Too few structured results
      (!searchData.query && structuredProducts.length === 0); // No structured search performed

    if (shouldUseSemanticSearch && searchData.query) {
      console.log('Activating Level 3 semantic search...');
      const semanticResult = await performSemanticSearch(supabase, searchData, maxResults);
      semanticProducts = semanticResult.products;
      semanticScores = semanticResult.semanticScores;
      semanticSearchUsed = true;
      
      if (searchData.semanticBoost) {
        searchMethod = 'semantic_boost';
      } else {
        searchMethod = structuredProducts.length > 0 ? 'hybrid_semantic_fallback' : 'semantic_only';
      }
    }

    // Combine and deduplicate results
    let finalProducts: any[] = [];
    let finalSemanticScores: number[] = [];
    
    if (searchData.semanticBoost && semanticProducts.length > 0) {
      // Semantic boost: prioritize semantic results
      finalProducts = semanticProducts;
      finalSemanticScores = semanticScores;
    } else if (structuredProducts.length > 0 && semanticProducts.length > 0) {
      // Hybrid: merge structured and semantic results, removing duplicates
      const seenIds = new Set();
      
      // Add structured results first
      for (const product of structuredProducts) {
        if (!seenIds.has(product.product_id)) {
          finalProducts.push(product);
          finalSemanticScores.push(0); // No semantic score for structured results
          seenIds.add(product.product_id);
        }
      }
      
      // Add semantic results that aren't already included
      for (let i = 0; i < semanticProducts.length; i++) {
        const product = semanticProducts[i];
        if (!seenIds.has(product.product_id)) {
          finalProducts.push(product);
          finalSemanticScores.push(semanticScores[i]);
          seenIds.add(product.product_id);
        }
      }
    } else if (semanticProducts.length > 0) {
      // Semantic only
      finalProducts = semanticProducts;
      finalSemanticScores = semanticScores;
    } else {
      // Structured only
      finalProducts = structuredProducts;
      finalSemanticScores = new Array(structuredProducts.length).fill(0);
    }

    // Limit final results
    finalProducts = finalProducts.slice(0, maxResults);
    finalSemanticScores = finalSemanticScores.slice(0, maxResults);

    // Filter out products with allergens if specified
    let filteredProducts = finalProducts;
    let filteredScores = finalSemanticScores;
    
    if (searchData.allergens && searchData.allergens.length > 0) {
      const filteredResults = finalProducts
        .map((product, index) => ({ product, score: finalSemanticScores[index] }))
        .filter(({ product }) => {
          const ingredients = product.product_data?.ingredients || [];
          return !searchData.allergens?.some(allergen => 
            ingredients.includes(allergen.toLowerCase())
          );
        });
      
      filteredProducts = filteredResults.map(r => r.product);
      filteredScores = filteredResults.map(r => r.score);
      searchMethod += '_allergy_filtered';
    }

    // Check inventory if franchisee specified
    if (searchData.franchiseeId && filteredProducts.length > 0) {
      const productIds = filteredProducts.map(p => p.product_id);
      const { data: inventory } = await supabase
        .from('inventory')
        .select('product_id, quantity_available')
        .eq('franchisee_id', searchData.franchiseeId)
        .in('product_id', productIds)
        .gt('quantity_available', 0);

      const availableProductIds = new Set(inventory?.map(i => i.product_id) || []);
      
      const availableResults = filteredProducts
        .map((product, index) => ({ product, score: filteredScores[index] }))
        .filter(({ product }) => availableProductIds.has(product.product_id));
      
      filteredProducts = availableResults.map(r => r.product);
      filteredScores = availableResults.map(r => r.score);
      searchMethod += '_inventory_checked';
    }

    // Sort by relevance - semantic scores first, then price
    const productsWithScores = filteredProducts.map((product, index) => ({
      product,
      semanticScore: filteredScores[index]
    }));

    productsWithScores.sort((a, b) => {
      // Sort by semantic score if available, then by price
      if (a.semanticScore > 0 || b.semanticScore > 0) {
        return b.semanticScore - a.semanticScore;
      }
      
      const priceA = parseFloat(a.product.product_data.product_info.base_price);
      const priceB = parseFloat(b.product.product_data.product_info.base_price);
      return priceA - priceB;
    });

    // Streamline the response
    const streamlinedProducts = productsWithScores.map(({ product, semanticScore }) => {
      const streamlined = streamlineProduct(product);
      if (semanticScore > 0) {
        streamlined.semanticScore = Math.round(semanticScore * 100) / 100; // Round to 2 decimals
      }
      return streamlined;
    });
    
    const response: StreamlinedResponse = {
      products: streamlinedProducts,
      count: streamlinedProducts.length,
      summary: generateSearchSummary(searchData, streamlinedProducts.length, semanticSearchUsed),
      searchMethod,
      semanticSearchUsed,
      structuredResultCount
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Search failed', 
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

function streamlineProduct(product: any): StreamlinedProduct {
  const productInfo = product.product_data.product_info;
  const options = product.product_data.options || [];
  const ingredients = product.product_data.ingredients || [];
  const addons = product.product_data.addons || [];
  
  // Create brief, customer-friendly description (max 100 chars)
  const description = productInfo.description ? 
    (productInfo.description.length > 100 ? 
      productInfo.description.substring(0, 97) + '...' : 
      productInfo.description) : 
    'Delicious arrangement perfect for any occasion';
  
  return {
    productId: productInfo.product_identifier?.toString() || '0000',
    name: productInfo.name,
    price: `$${parseFloat(productInfo.base_price).toFixed(2)}`,
    description,
    options: options.length > 1 ? options.map((option: any) => ({
      name: option.option_name,
      price: `$${parseFloat(option.price).toFixed(2)}`,
      _internalId: option.id
    })) : undefined,
    allergens: ingredients.filter((ingredient: string) => 
      ['nuts', 'peanut', 'dairy', 'gluten', 'soy'].includes(ingredient.toLowerCase())
    ),
    availableAddons: addons.slice(0, 3).map((addon: any) => 
      `${addon.name} ($${parseFloat(addon.price).toFixed(2)})`
    ),
    _internalId: product.product_id
  };
}

function generateSearchSummary(
  searchData: SearchRequest, 
  count: number, 
  semanticSearchUsed: boolean
): string {
  if (count === 0) {
    return semanticSearchUsed 
      ? "I couldn't find any products that closely match your description. Try different keywords or browse our categories."
      : "I couldn't find any products matching your criteria. Try a broader search or different keywords.";
  }

  let summary = `Found ${count} product${count !== 1 ? 's' : ''}`;
  
  if (searchData.query) {
    if (semanticSearchUsed) {
      summary += ` related to "${searchData.query}"`;
    } else {
      summary += ` matching "${searchData.query}"`;
    }
  }
  
  if (searchData.category || searchData.occasion) {
    summary += ` for ${searchData.category || searchData.occasion}`;
  }
  
  if (searchData.priceRange) {
    const priceText = {
      'budget': 'under $50',
      'mid': '$50-100',
      'medium': '$50-100', 
      'premium': 'over $100',
      'luxury': 'over $100'
    }[searchData.priceRange.toLowerCase()] || searchData.priceRange;
    summary += ` in ${priceText} range`;
  } else if (searchData.maxPrice || searchData.minPrice) {
    if (searchData.minPrice && searchData.maxPrice) {
      summary += ` between $${searchData.minPrice} and $${searchData.maxPrice}`;
    } else if (searchData.maxPrice) {
      summary += ` under $${searchData.maxPrice}`;
    } else if (searchData.minPrice) {
      summary += ` over $${searchData.minPrice}`;
    }
  }
  
  if (searchData.allergens && searchData.allergens.length > 0) {
    summary += ` (safe for ${searchData.allergens.join(', ')} allergies)`;
  }

  if (semanticSearchUsed) {
    summary += ` using AI semantic search`;
  }
  
  return summary;
} 