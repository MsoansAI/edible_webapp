'use client'

import { useState, useEffect } from 'react'
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline'

interface FloatingActionManagerProps {
  children: React.ReactNode // The action bar content
  showActionBar?: boolean
  className?: string
}

export default function FloatingActionManager({ 
  children, 
  showActionBar = true, 
  className = '' 
}: FloatingActionManagerProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isActionBarMinimized, setIsActionBarMinimized] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  // Handle scroll behavior to auto-hide action bar when scrolling
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout
    
    const handleScroll = () => {
      setIsScrolling(true)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const toggleActionBar = () => {
    setIsActionBarMinimized(!isActionBarMinimized)
  }

  return (
    <>
      {/* Floating Chat Button - Position adjusts based on action bar state */}
      <div 
        className={`fixed z-50 transition-all duration-300 ${
          showActionBar && !isActionBarMinimized 
            ? 'bottom-24 right-4' // Above action bar
            : 'bottom-6 right-4'   // Normal position
        }`}
      >
        <button
          onClick={toggleChat}
          className={`w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
            isChatOpen ? 'rotate-180' : ''
          }`}
          aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          {isChatOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Chat Panel - Slides up from bottom */}
      <div className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        isChatOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-white border-t border-neutral-200 shadow-2xl">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Chat Assistant</h3>
                <p className="text-sm text-neutral-500">Ask me anything about our products</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Chat Content */}
          <div className="h-96 p-4">
            <div className="text-center text-neutral-500 mt-20">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>Chat functionality will be integrated here</p>
              <p className="text-sm mt-2">This space intelligently adapts when the action bar is present</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar - Smart positioning */}
      {showActionBar && (
        <div className={`md:hidden fixed left-0 right-0 z-30 transition-all duration-300 ${
          isActionBarMinimized
            ? 'bottom-0 transform translate-y-16' // Slide down but keep toggle visible
            : isScrolling
            ? 'bottom-0 transform translate-y-2 opacity-90' // Slight hide on scroll
            : 'bottom-0 transform translate-y-0' // Normal position
        } ${isChatOpen ? 'translate-y-full' : ''}`}> {/* Hide completely when chat is open */}
          
          {/* Action Bar Toggle (when minimized) */}
          {isActionBarMinimized && (
            <div className="bg-white border-t border-neutral-200 px-4 py-2">
              <button
                onClick={toggleActionBar}
                className="w-full flex items-center justify-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ChevronUpIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Show Actions</span>
              </button>
            </div>
          )}

          {/* Main Action Bar */}
          <div className={`bg-white border-t border-neutral-200 safe-area-pb transition-transform duration-200 ${
            isActionBarMinimized ? 'transform translate-y-full' : ''
          }`}>
            {/* Minimize Toggle */}
            <div className="px-4 py-2 border-b border-neutral-100">
              <button
                onClick={toggleActionBar}
                className="w-full flex items-center justify-center space-x-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <ChevronDownIcon className="h-3 w-3" />
                <span className="text-xs">Minimize</span>
              </button>
            </div>
            
            {/* Action Bar Content */}
            <div className={className}>
              {children}
            </div>
          </div>
        </div>
      )}

      {/* Background Overlay when chat is open */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleChat}
        />
      )}
    </>
  )
} 