'use client'

import { useState } from 'react'

export default function TestDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  
  // Only show in development
  const isDev = process.env.NODE_ENV === 'development'
  
  console.log('TestDashboard:', { isDev, isVisible })
  
  if (!isDev) return null

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <button
          onClick={() => {
            console.log('Test button clicked!')
            setIsVisible(true)
          }}
          className="fixed bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors z-[9999]"
          title="Test Dashboard"
        >
          TEST
        </button>
      )}

      {/* Test Panel */}
      {isVisible && (
        <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-[9999]">
          <h3 className="text-lg font-bold">Test Dashboard</h3>
          <p>This is working!</p>
          <button
            onClick={() => setIsVisible(false)}
            className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
} 