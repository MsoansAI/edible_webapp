/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductData {
  product_info?: {
    name?: string;
    description?: string;
  };
  categories?: Array<{
    name?: string;
    type?: string;
  }>;
  ingredients?: string[];
  options?: Array<{
    option_name?: string;
    description?: string;
  }>;
}

function generateTextForEmbedding(productData: ProductData): string {
  const parts: string[] = [];
  
  if (productData?.product_info?.name) {
    parts.push(`Product Name: ${productData.product_info.name}`);
  }
  
  if (productData?.product_info?.description) {
    const description = productData.product_info.description.replace(/\.$/, '');
    parts.push(`Description: ${description}`);
  }
  
  if (productData?.categories && productData.categories.length > 0) {
    const catNames = productData.categories
      .map(cat => cat.name)
      .filter(Boolean);
    if (catNames.length > 0) {
      parts.push(`Categories: ${catNames.join(', ')}`);
    }
  }
  
  if (productData?.ingredients && productData.ingredients.length > 0) {
    parts.push(`Key Ingredients: ${productData.ingredients.join(', ')}`);
  }
  
  if (productData?.options && productData.options.length > 0) {
    const optionTexts = productData.options
      .map(opt => {
        if (opt.option_name) {
          return opt.description 
            ? `Option: ${opt.option_name} (${opt.description})`
            : `Option: ${opt.option_name}`;
        }
        return null;
      })
      .filter(Boolean);
    
    if (optionTexts.length > 0) {
      parts.push(`Available Options: ${optionTexts.join(', ')}`);
    }
  }
  
  return parts.join('. ');
}

async function getEmbeddingFromOpenAI(text: string, openaiApiKey: string): Promise<number[] | null> {
  if (!text.trim()) {
    console.log('No text provided for embedding generation');
    return null;
  }

  // Truncate text if too long (OpenAI limit is around 8191 tokens)
  const maxChars = 20000; // Heuristic: ~4 chars per token
  const processedText = text.length > maxChars ? text.substring(0, maxChars) : text;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [processedText.trim()],
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
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  console.log('Function started!')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId } = await req.json()
    console.log('Product ID:', productId)
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get product data from chatbot_products_flat
    const { data: flatProductData, error: flatProductError } = await supabase
      .from('chatbot_products_flat')
      .select('product_data')
      .eq('product_id', productId)
      .single()

    if (flatProductError || !flatProductData) {
      console.error('Error fetching product data:', flatProductError)
      return new Response(
        JSON.stringify({ error: 'Product not found in chatbot_products_flat' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate text for embedding
    const textToEmbed = generateTextForEmbedding(flatProductData.product_data)
    
    if (!textToEmbed) {
      console.error('Could not generate text for embedding from product data')
      return new Response(
        JSON.stringify({ error: 'Could not generate text for embedding' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Generated text for embedding:', textToEmbed.substring(0, 100) + '...')

    // Get embedding from OpenAI
    const embedding = await getEmbeddingFromOpenAI(textToEmbed, openaiApiKey)
    
    if (!embedding) {
      console.error('Failed to generate embedding')
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Generated embedding with length:', embedding.length)

    // Update the products table with the embedding
    const { error: updateError } = await supabase
      .from('products')
      .update({ embedding })
      .eq('id', productId)

    if (updateError) {
      console.error('Error updating product embedding:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update product embedding' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully generated and stored embedding for product ${productId}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        productId,
        embeddingLength: embedding.length,
        textLength: textToEmbed.length,
        message: 'Embedding generated and stored successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-embedding function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 