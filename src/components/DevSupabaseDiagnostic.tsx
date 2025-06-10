'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface SupabaseDiagnosticResult {
  connection: {
    connected: boolean
    error?: string
    latency?: number
  }
  products: {
    accessible: boolean
    count: number
    sampleIds: string[]
    error?: string
  }
  rlsPolicies: {
    enabled: boolean
    selectEnabled: boolean
    error?: string
  }
}

export default function DevSupabaseDiagnostic() {
  const [results, setResults] = useState<SupabaseDiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    setResults(null)

    try {
      const diagnostic: SupabaseDiagnosticResult = {
        connection: { connected: false },
        products: { accessible: false, count: 0, sampleIds: [] },
        rlsPolicies: { enabled: false, selectEnabled: false }
      }

      // Test 1: Basic connection
      console.log('🔗 Testing Supabase connection...')
      const connectionStart = Date.now()
      try {
        const { data, error } = await supabase.from('products').select('count').limit(1)
        diagnostic.connection = {
          connected: !error,
          latency: Date.now() - connectionStart,
          error: error?.message
        }
        console.log('✅ Connection test:', diagnostic.connection)
      } catch (error) {
        diagnostic.connection = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        console.log('❌ Connection failed:', diagnostic.connection)
      }

      // Test 2: Product data access
      if (diagnostic.connection.connected) {
        console.log('📊 Testing product data access...')
        try {
          const { data: products, error } = await supabase
            .from('products')
            .select('product_identifier, name, is_active')
            .eq('is_active', true)
            .limit(5)

          diagnostic.products = {
            accessible: !error && !!products,
            count: products?.length || 0,
            sampleIds: products?.map(p => p.product_identifier?.toString()) || [],
            error: error?.message
          }
          console.log('✅ Product data test:', diagnostic.products)
        } catch (error) {
          diagnostic.products = {
            accessible: false,
            count: 0,
            sampleIds: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          console.log('❌ Product data test failed:', diagnostic.products)
        }
      }

      // Test 3: RLS policies (basic check)
      if (diagnostic.connection.connected) {
        console.log('🔒 Testing RLS policies...')
        try {
          // Try to access without any filters to see if RLS is blocking
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .limit(1)

          diagnostic.rlsPolicies = {
            enabled: true, // Assume RLS is enabled if we get here
            selectEnabled: !error,
            error: error?.message
          }
          console.log('✅ RLS test:', diagnostic.rlsPolicies)
        } catch (error) {
          diagnostic.rlsPolicies = {
            enabled: false,
            selectEnabled: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          console.log('❌ RLS test failed:', diagnostic.rlsPolicies)
        }
      }

      setResults(diagnostic)
    } catch (error) {
      console.error('Diagnostic failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  if (loading && !results) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="h-5 w-5 animate-spin text-blue-600" />
          <h3 className="font-medium text-blue-900">Running Supabase Diagnostic...</h3>
        </div>
        <p className="text-blue-800 text-sm">Checking database connection and data access...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-medium text-red-900 mb-2">Diagnostic Failed</h3>
        <p className="text-red-800 text-sm">Unable to run Supabase diagnostic.</p>
      </div>
    )
  }

  const hasIssues = !results.connection.connected || !results.products.accessible || results.products.count === 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Supabase Diagnostic</h3>
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {loading ? 'Running...' : 'Refresh'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          {results.connection.connected ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium text-sm">
            Database Connection {results.connection.latency && `(${results.connection.latency}ms)`}
          </span>
        </div>
        {results.connection.error && (
          <p className="text-red-600 text-xs">{results.connection.error}</p>
        )}
      </div>

      {/* Product Data Access */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          {results.products.accessible && results.products.count > 0 ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium text-sm">
            Product Data Access ({results.products.count} products found)
          </span>
        </div>
        {results.products.sampleIds.length > 0 ? (
          <div className="text-xs text-gray-600">
            Sample IDs: {results.products.sampleIds.join(', ')}
          </div>
        ) : (
          <p className="text-red-600 text-xs">
            {results.products.error || 'No product data accessible'}
          </p>
        )}
      </div>

      {/* RLS Policies */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          {results.rlsPolicies.selectEnabled ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          ) : (
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
          )}
          <span className="font-medium text-sm">RLS Policies</span>
        </div>
        {results.rlsPolicies.error && (
          <p className="text-yellow-600 text-xs">{results.rlsPolicies.error}</p>
        )}
      </div>

      {/* Issue Summary & Solutions */}
      {hasIssues && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">⚠️ Issues Detected</h4>
          <div className="space-y-2 text-sm text-yellow-800">
            {!results.connection.connected && (
              <div>• Database connection failed - check environment variables</div>
            )}
            {results.connection.connected && !results.products.accessible && (
              <div>• Cannot access products table - check RLS policies</div>
            )}
            {results.connection.connected && results.products.accessible && results.products.count === 0 && (
              <div>• Products table is empty - add sample data</div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <h5 className="font-medium text-yellow-900 mb-1">Quick Fixes:</h5>
            <div className="text-xs text-yellow-800 space-y-1">
              <div>1. Try visiting: <code className="bg-yellow-100 px-1 rounded">/products/{results.products.sampleIds[0] || '6479'}</code></div>
              <div>2. Check Supabase dashboard RLS policies for `products` table</div>
              <div>3. Verify products table has `is_active = true` data</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!hasIssues && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">✅ Supabase is Working!</h4>
          </div>
          <p className="text-green-800 text-sm mt-1">
            Database connection and product data access are functioning correctly.
          </p>
          {results.products.sampleIds.length > 0 && (
            <div className="mt-2 text-xs text-green-700">
              Try: <a 
                href={`/products/${results.products.sampleIds[0]}`}
                className="underline hover:text-green-800"
                target="_blank"
              >
                /products/{results.products.sampleIds[0]}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 