'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import DevSupabaseDiagnostic from './DevSupabaseDiagnostic'

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
    return <CheckCircleIcon className="h-4 w-4 text-green-500" />
  } else {
    return <XCircleIcon className="h-4 w-4 text-red-500" />
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
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gradeColors[grade as keyof typeof gradeColors] || 'text-gray-600 bg-gray-100'}`}>
      {grade} ({score}/100)
    </div>
  )
}

interface DevDiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DevDiagnosticModal({ isOpen, onClose }: DevDiagnosticModalProps) {
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(false)
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
    if (isOpen && !report) {
      runDiagnostic()
    }
  }, [isOpen, report])

  const handleClose = () => {
    onClose()
    // Reset state when closing
    setTimeout(() => {
      setReport(null)
      setError(null)
    }, 300)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Development Environment Diagnostic
                  </Dialog.Title>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runDiagnostic}
                      disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <ClockIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-96 overflow-y-auto">
                  {loading && (
                    <div className="text-center py-8">
                      <ClockIcon className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-gray-600">Running diagnostic...</p>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-8">
                      <XCircleIcon className="h-6 w-6 text-red-600 mx-auto mb-3" />
                      <p className="text-gray-600 mb-3">Error: {error}</p>
                      <button 
                        onClick={runDiagnostic}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {report && (
                    <div className="space-y-4">
                      {/* Overall Score */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Overall Score</h3>
                            <GradeDisplay grade={report.summary.grade} score={report.summary.score} />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{report.summary.score}</div>
                            <div className="text-xs text-gray-500">out of 100</div>
                          </div>
                        </div>
                      </div>

                      {/* Supabase Specific Diagnostic */}
                      <DevSupabaseDiagnostic />

                      {/* Environment Checks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Runtime */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 text-sm">Runtime</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <StatusIcon result={report.details.nodeVersion} />
                                <span>Node.js</span>
                              </div>
                              <span className="text-gray-600 text-xs">{report.details.nodeVersion.version}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <StatusIcon result={report.details.nextVersion} />
                                <span>Next.js</span>
                              </div>
                              <span className="text-gray-600 text-xs">{report.details.nextVersion.version}</span>
                            </div>
                          </div>
                        </div>

                        {/* Configuration */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 text-sm">Configuration</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <StatusIcon result={report.details.environmentVariables} />
                                <span>Environment</span>
                              </div>
                              {report.details.environmentVariables.missing.length > 0 && (
                                <span className="text-red-600 text-xs">
                                  {report.details.environmentVariables.missing.length} missing
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <StatusIcon result={report.details.dependencies} />
                                <span>Dependencies</span>
                              </div>
                              {report.details.dependencies.missing.length > 0 && (
                                <span className="text-red-600 text-xs">
                                  {report.details.dependencies.missing.length} missing
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Database */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 text-sm">Database</h4>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <StatusIcon result={report.details.supabaseConnection} />
                              <span>Supabase</span>
                            </div>
                            {report.details.supabaseConnection.error && (
                              <span className="text-red-600 text-xs">Error</span>
                            )}
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 text-sm">Performance</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Memory</span>
                              <span className="text-gray-600 text-xs">{report.details.performance.memoryUsage}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Bundle Size</span>
                              <span className="text-gray-600 text-xs">
                                {(report.details.performance.bundleSize / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Issues */}
                      {report.recommendations.critical.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                            <h4 className="font-medium text-red-900 text-sm">Critical Issues</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.recommendations.critical.map((issue, index) => (
                              <li key={index} className="text-red-800 text-xs">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.recommendations.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                            <h4 className="font-medium text-yellow-900 text-sm">Warnings</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.recommendations.warnings.map((warning, index) => (
                              <li key={index} className="text-yellow-800 text-xs">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Success */}
                      {report.recommendations.critical.length === 0 && report.recommendations.warnings.length === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            <h4 className="font-medium text-green-900 text-sm">Environment is Healthy!</h4>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center">
                  <a 
                    href="/dev-diagnostic" 
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View Full Report →
                  </a>
                  <button
                    onClick={handleClose}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 