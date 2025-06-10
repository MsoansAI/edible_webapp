'use client';

import { useState, useEffect } from 'react';
import { 
  ChatBubbleOvalLeftIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';

interface FloatingChatButtonProps {
  className?: string;
}

export default function FloatingChatButton({ className = '' }: FloatingChatButtonProps) {
  const { isChatOpen, toggleChat } = useUIStore();
  const { items } = useCartStore();
  const [showPulse, setShowPulse] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Debug click handler
  const handleChatToggle = () => {
    toggleChat();
  };

  // Contextual triggers - show pulse based on user behavior
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Show pulse when cart has items but user hasn't interacted with chat
    if (items.length > 0 && !isChatOpen) {
      timer = setTimeout(() => {
        setShowPulse(true);
        // Auto-hide pulse after 5 seconds
        setTimeout(() => setShowPulse(false), 5000);
      }, 30000); // Show after 30 seconds with items in cart
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [items.length, isChatOpen]);

  // Hide pulse when user hovers (they've noticed the button)
  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowPulse(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Contextual hint bubble - appears above button */}
      {showPulse && !isChatOpen && (
        <div className="absolute bottom-full right-0 animate-fade-in-up z-[10000]">
          <div className="bg-white border border-gray-200 shadow-lg px-4 py-3 min-w-[240px] relative mb-5">
            {/* Speech bubble arrow */}
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200 translate-y-px"></div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Need help with your order?
                </p>
                <p className="text-xs text-gray-600">
                  I can help you complete your purchase or answer questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <button
        onClick={handleChatToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-red-600/20 cursor-pointer pointer-events-auto"
        aria-label={isChatOpen ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {/* Background pulse effect for contextual triggers */}
        {showPulse && (
          <div className="absolute inset-0 bg-red-600 animate-ping opacity-75"></div>
        )}

        {/* Button icon with smooth transition */}
        <div className={`transform transition-all duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        } ${isChatOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isChatOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          )}
        </div>

        {/* Cart item count indicator */}
        {items.length > 0 && !isChatOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white text-red-600 text-xs font-bold flex items-center justify-center shadow-lg">
            {items.length > 9 ? '9+' : items.length}
          </div>
        )}

        {/* Online status indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white shadow-sm">
          <div className="w-full h-full bg-green-500 animate-pulse"></div>
        </div>
      </button>
    </div>
  );
} 