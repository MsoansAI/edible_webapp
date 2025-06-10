'use client';

import { useUIStore } from '@/store/uiStore';
import { usePathname } from 'next/navigation';
import FloatingChatButton from './FloatingChatButton';
import ChatWidget from './ChatWidget';

interface ElegantChatAssistantProps {
  className?: string;
}

/**
 * ElegantChatAssistant - Premium chat experience for Edible Arrangements
 * 
 * Features:
 * - Floating button with contextual triggers
 * - Full-screen chat on mobile, popup on desktop
 * - Smart integration with cart and user context
 * - Premium design matching site aesthetics
 * - Mobile-responsive and accessible
 */
export default function ElegantChatAssistant({ className = '' }: ElegantChatAssistantProps) {
  const { isChatOpen } = useUIStore();
  const pathname = usePathname();
  
  // Check if we're on a product page for dynamic positioning
  const isProductPage = pathname?.startsWith('/products/') && pathname !== '/products';
  
  return (
    <>
      {/* Chat button - positioned absolutely to viewport */}
      <div className={`fixed ${isProductPage ? 'bottom-20' : 'bottom-4'} right-4 z-[9999] ${className}`}>
        <FloatingChatButton />
        
        {/* Chat widget - positioned relative to the button for desktop popup */}
        {isChatOpen && <ChatWidget />}
      </div>
    </>
  );
} 