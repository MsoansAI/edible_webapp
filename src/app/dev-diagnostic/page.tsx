'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DiagnosticResult {
  isValid?: boolean
  isSupported?: boolean
  connected?: boolean
  version?: string
  error?: string
  recommendation?: string
  score?: number
  grade?: string
  status?: string
}

interface DiagnosticReport {
  summary: {
    score: number
    grade: string
    status: string
    timestamp: string
  }
  details: {
    nodeVersion: DiagnosticResult
    nextVersion: DiagnosticResult
    environmentVariables: DiagnosticResult & { missing: string[] }
    dependencies: DiagnosticResult & { missing: any[], conditionalDependencies: any[] }
    supabaseConnection: DiagnosticResult
    performance: {
      buildTime: number
      bundleSize: number
      memoryUsage: number
    }
  }
  recommendations: {
    critical: string[]
    warnings: string[]
    suggestions: string[]
  }
}

const StatusIcon = ({ result }: { result: DiagnosticResult }) => {
  const isSuccess = result.isValid || result.isSupported || result.connected
  
  if (isSuccess) {
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />
  } else {
    return <XCircleIcon className="h-5 w-5 text-red-500" />
  }
}

const GradeDisplay = ({ grade, score }: { grade: string, score: number }) => {
  const gradeColors = {
    'A': 'text-green-600 bg-green-100',
    'B': 'text-green-600 bg-green-100',
    'C': 'text-yellow-600 bg-yellow-100',
    'D': 'text-orange-600 bg-orange-100',
    'F': 'text-red-600 bg-red-100'
  }
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${gradeColors[grade as keyof typeof gradeColors] || 'text-gray-600 bg-gray-100'}`}>
      Grade {grade} ({score}/100)
    </div>
  )
}

export default function DevDiagnosticPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/dev-diagnostic')
      if (!response.ok) {
        throw new Error('Failed to run diagnostic')
      }
      const data = await response.json()
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Running development environment diagnostic...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Error running diagnostic: {error}</p>
          <button 
            onClick={runDiagnostic}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No diagnostic data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Development Environment Diagnostic</h1>
              <p className="text-gray-600 mt-2">
                Generated on {new Date(report.summary.timestamp).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={runDiagnostic}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <ClockIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Overall Score</h2>
              <GradeDisplay grade={report.summary.grade} score={report.summary.score} />
              <p className="text-gray-600 mt-2">{report.summary.status}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{report.summary.score}</div>
              <div className="text-sm text-gray-500">out of 100</div>
            </div>
          </div>
        </div>

        {/* Environment Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Node.js & Next.js */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Runtime Environment</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon result={report.details.nodeVersion} />
                  <span className="font-medium">Node.js</span>
                </div>
                <span className="text-gray-600">{report.details.nodeVersion.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon result={report.details.nextVersion} />
                  <span className="font-medium">Next.js</span>
                </div>
                <span className="text-gray-600">{report.details.nextVersion.version}</span>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon result={report.details.environmentVariables} />
                  <span className="font-medium">Environment Variables</span>
                </div>
                {report.details.environmentVariables.missing.length > 0 && (
                  <span className="text-red-600 text-sm">
                    {report.details.environmentVariables.missing.length} missing
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon result={report.details.dependencies} />
                  <span className="font-medium">Dependencies</span>
                </div>
                {report.details.dependencies.missing.length > 0 && (
                  <span className="text-red-600 text-sm">
                    {report.details.dependencies.missing.length} missing
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon result={report.details.supabaseConnection} />
                  <span className="font-medium">Supabase Connection</span>
                </div>
                {report.details.supabaseConnection.error && (
                  <span className="text-red-600 text-sm">Error</span>
                )}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Memory Usage</span>
                <span className="text-gray-600">{report.details.performance.memoryUsage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Bundle Size</span>
                <span className="text-gray-600">
                  {(report.details.performance.bundleSize / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues and Recommendations */}
        {(report.recommendations.critical.length > 0 || report.recommendations.warnings.length > 0 || report.recommendations.suggestions.length > 0) && (
          <div className="space-y-6">
            {/* Critical Issues */}
            {report.recommendations.critical.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Critical Issues</h3>
                </div>
                <ul className="space-y-2">
                  {report.recommendations.critical.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span className="text-red-800">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {report.recommendations.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-900">Warnings</h3>
                </div>
                <ul className="space-y-2">
                  {report.recommendations.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span className="text-yellow-800">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {report.recommendations.suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {report.recommendations.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {report.recommendations.critical.length === 0 && report.recommendations.warnings.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">Environment is Healthy!</h3>
            </div>
            <p className="text-green-800 mt-2">
              Your development environment is properly configured and ready for development.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 