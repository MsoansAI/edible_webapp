'use client'

import { useState } from 'react'
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import DevDiagnosticModal from './DevDiagnosticModal'

interface DevDiagnosticButtonProps {
  className?: string
  position?: 'fixed' | 'relative'
}

export default function DevDiagnosticButton({ 
  className = '',
  position = 'fixed' 
}: DevDiagnosticButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const buttonClasses = position === 'fixed' 
    ? `fixed bottom-4 left-4 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${className}`
    : `bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md shadow transition-colors ${className}`

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={buttonClasses}
        title="Development Environment Diagnostic"
        aria-label="Run development environment diagnostic"
      >
        <WrenchScrewdriverIcon className={position === 'fixed' ? 'h-6 w-6' : 'h-5 w-5'} />
      </button>

      <DevDiagnosticModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
} 