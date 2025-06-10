import { supabase } from '@/lib/supabase'

interface ProductTest {
  product_identifier: number
  name: string
  base_price: number
  is_active: boolean
}

export default async function DiagnosticTestPage() {
  let products: ProductTest[] = []
  let error: string | null = null

  try {
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('product_identifier, name, base_price, is_active')
      .eq('is_active', true)
      .limit(5)

    if (fetchError) {
      error = fetchError.message
    } else {
      products = data || []
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Supabase Diagnostic Test</h1>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Server-Side Product Fetch Test</h2>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">❌ Error:</h3>
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-4">✅ Success: Found {products.length} products</h3>
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div key={index} className="bg-white rounded p-3 border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                        <span className="text-sm text-gray-500 ml-2">(ID: {product.product_identifier})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-medium">${product.base_price}</span>
                        <a 
                          href={`/products/${product.product_identifier}`}
                          className="ml-4 text-blue-600 hover:text-blue-700 text-sm underline"
                        >
                          Test →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">🧪 Quick Tests:</h3>
          <div className="space-y-2 text-sm">
            <div>• <strong>Dev Diagnostic Button:</strong> Look for purple wrench icon in bottom-left corner</div>
            <div>• <strong>Working Product:</strong> <a href="/products/6479" className="text-blue-600 underline">/products/6479</a></div>
            <div>• <strong>All Products:</strong> <a href="/products" className="text-blue-600 underline">/products</a></div>
            <div>• <strong>Homepage:</strong> <a href="/" className="text-blue-600 underline">/</a></div>
          </div>
        </div>
      </div>
    </div>
  )
} 