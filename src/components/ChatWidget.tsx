'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  XMarkIcon, 
  MinusIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
  ShoppingCartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import ThinkingEffect from './ThinkingEffect';
import toast from 'react-hot-toast';
import {
  interact,
  generateUserId,
  launchRequest,
  sendMessageWithFullContext,
  VoiceflowTrace,
  VoiceflowRequestAction
} from '@/lib/voiceflow';
import { processVoiceflowTraces } from '@/lib/voiceflowActions';

// Enhanced interfaces from ChatPanel
export interface VoiceflowButton {
  name: string;
  request: VoiceflowRequestAction;
}

export interface CarouselCard {
  id: string;
  title: string;
  description: { slate?: any[]; text: string };
  imageUrl?: string;
  buttons?: VoiceflowButton[];
  metadata?: any;
}

export interface CarouselData {
  layout?: string;
  metadata?: { carouselType?: string; [key: string]: any };
  cards: CarouselCard[];
}

interface ChatMessage {
  id: string;
  content?: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  type: 'text' | 'loading' | 'error' | 'choice' | 'buttons' | 'carousel';
  choices?: Array<{ name: string; request: string }>;
  payload?: {
    buttons?: VoiceflowButton[];
    carouselData?: CarouselData;
    details?: any;
    [key: string]: any;
  };
}

// Compact Product Display Component for smaller ChatWidget UI
const CompactProductDisplay: React.FC<{ 
  carousel: CarouselData, 
  onButtonClick: (request: VoiceflowRequestAction, buttonName: string) => void, 
  isLoading: boolean 
}> = ({ carousel, onButtonClick, isLoading }) => {
  
  if (!carousel || !carousel.cards || carousel.cards.length === 0) {
    return <p className="text-xs text-gray-400 italic">No products available.</p>;
  }

  const handleAddToCart = (card: CarouselCard, e: React.MouseEvent) => {
    e.stopPropagation();
    // Mock product data - in real implementation, extract from card metadata
    const mockProduct = {
      id: card.id,
      product_identifier: parseInt(card.id) || 1001,
      name: card.title,
      description: card.description.text,
      base_price: 49.99, // Extract from card or metadata
      image_url: card.imageUrl || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to cart using the cart store
    const { addItem } = useCartStore.getState();
    addItem(mockProduct);
    toast.success(`${card.title} added to cart!`);
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
        <SparklesIcon className="h-4 w-4 text-red-600 mr-2" />
        Featured Products
      </h4>
      
      {/* Compact 2x2 Grid for Mobile, Single Column for smaller spaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {carousel.cards.slice(0, 4).map((card, index) => (
          <div key={card.id || `product-${index}`} className="
            bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 
            hover:shadow-md hover:border-red-200 transition-all duration-200
          ">
            {/* Compact Product Image */}
            {card.imageUrl && (
              <div className="relative w-full h-24 bg-gradient-to-br from-gray-50 to-gray-100">
                <Image 
                  src={card.imageUrl} 
                  alt={card.title} 
                  fill
                  className="object-cover transition-transform duration-200 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            )}
            
            {/* Compact Product Info */}
            <div className="p-2">
              <h5 className="font-medium text-xs text-gray-800 line-clamp-1 mb-1" title={card.title}>
                {card.title}
              </h5>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-tight">
                {card.description?.text || ''}
              </p>
              
              {/* Compact Action Buttons */}
              <div className="flex flex-col gap-1">
                {card.buttons && card.buttons.length > 0 && (
                  <>
                    {card.buttons.slice(0, 2).map((button, btnIndex) => {
                      const isAddToCart = button.request.payload?.action_type === 'add_to_cart';
                      
                      return (
                        <button
                          key={`${card.id}-btn-${btnIndex}`}
                          onClick={(e) => onButtonClick(button.request, button.name)}
                          disabled={isLoading}
                          className={`text-xs py-1.5 px-2 rounded font-medium transition-all duration-200 
                            disabled:opacity-50 flex items-center justify-center gap-1 ${
                            isAddToCart 
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {isAddToCart && <ShoppingCartIcon className="w-3 h-3" />}
                          <span className="truncate">{button.name}</span>
                        </button>
                      );
                    })}
                    
                    {/* Quick Add to Cart if not already present */}
                    {!card.buttons.some(btn => btn.request.payload?.action_type === 'add_to_cart') && (
                      <button
                        onClick={(e) => handleAddToCart(card, e)}
                        className="text-xs py-1.5 px-2 bg-red-600 text-white hover:bg-red-700 
                          rounded font-medium transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <ShoppingCartIcon className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Show More Products Link */}
      {carousel.cards.length > 4 && (
        <div className="text-center pt-2 border-t border-gray-200">
          <button 
            onClick={() => window.open('/products', '_blank')}
            className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline 
              transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span>View all {carousel.cards.length} products</span>
            <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function ChatWidget() {
  const { isChatOpen, closeChat } = useUIStore();
  const { items, getTotal } = useCartStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initialize messages from sessionStorage to persist during browser session
    try {
      const stored = sessionStorage.getItem('chatbot-messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.log('Could not restore messages from sessionStorage');
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasEverBeenInitialized, setHasEverBeenInitialized] = useState(() => {
    // Initialize from sessionStorage to persist during browser session
    try {
      return sessionStorage.getItem('chatbot-initialized') === 'true';
    } catch {
      return false;
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isInitializing = useRef(false);

  // Check if we're on a product page
  const isProductPage = pathname?.includes('/products/');
  
  // Check Voiceflow configuration
  const isVoiceflowConfigured = () => {
    const apiKey = process.env.NEXT_PUBLIC_VOICEFLOW_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_VOICEFLOW_PROJECT_ID;
    return apiKey && projectId && apiKey !== 'VF.DM.YOUR_API_KEY_HERE';
  };

  // Generate or restore unique user ID from localStorage
  useEffect(() => {
    if (!userId) {
      // Try to get existing userId from localStorage
      let storedUserId = null;
      try {
        storedUserId = localStorage.getItem('chatbot-user-id');
      } catch (error) {
        console.log('localStorage not available, using session-only userId');
      }
      
              if (storedUserId) {
          setUserId(storedUserId);
          console.log('Restored existing userId:', storedUserId);
          // Global debug function for testing
          (window as any).clearChatSession = clearChatSession;
        } else {
        const newUserId = generateUserId();
        setUserId(newUserId);
        try {
          localStorage.setItem('chatbot-user-id', newUserId);
          console.log('Created new userId:', newUserId);
        } catch (error) {
          console.log('Could not save userId to localStorage');
        }
      }
    }
  }, [userId]);

  // Initialize chat when opened for the first time
  useEffect(() => {
    if (isChatOpen && userId && !hasEverBeenInitialized && !isInitializing.current) {
      isInitializing.current = true;
      console.log('Chat opened for first time, initializing session with userId:', userId);

      // Check if Voiceflow is configured
      if (!isVoiceflowConfigured()) {
        addMessage({
          content: getWelcomeMessage(),
          sender: 'assistant',
          type: 'text'
        });
        setTimeout(() => addMessage({
          content: "Note: I'm running in demo mode. To enable full AI capabilities, please configure your Voiceflow integration in your environment variables.",
          sender: 'system',
          type: 'error'
        }), 1000);
        setHasEverBeenInitialized(true);
        try {
          sessionStorage.setItem('chatbot-initialized', 'true');
        } catch (error) {
          console.log('Could not save initialization state to sessionStorage');
        }
      } else {
        // Initialize with Voiceflow
        initializeVoiceflowSession(userId);
      }
    }
  }, [isChatOpen, userId, hasEverBeenInitialized]);

  // Handle chat reopening after initial session
  useEffect(() => {
    if (isChatOpen && hasEverBeenInitialized && messages.length > 0) {
      console.log('Chat reopened, preserving existing session');
      // Just scroll to bottom to show latest messages
      setTimeout(scrollToBottom, 100);
    }
  }, [isChatOpen, hasEverBeenInitialized, messages.length]);

  // Save messages to sessionStorage and scroll to bottom when they change
  useEffect(() => {
    // Save messages to sessionStorage for session persistence
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('chatbot-messages', JSON.stringify(messages));
      }
    } catch (error) {
      console.log('Could not save messages to sessionStorage');
    }
    
    // Scroll to bottom
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to clear chat session (for testing or logout)
  const clearChatSession = () => {
    try {
      localStorage.removeItem('chatbot-user-id');
      sessionStorage.removeItem('chatbot-initialized');
      sessionStorage.removeItem('chatbot-messages');
    } catch (error) {
      console.log('Could not clear chat session storage');
    }
    setMessages([]);
    setUserId(null);
    setHasEverBeenInitialized(false);
    setIsInitialized(false);
  };

  const getWelcomeMessage = () => {
    return `This is Edie, Edible's AI assistant! I'm here to help you with:
    
    🌹 Fresh flower arrangements and bouquets
    🍓 Chocolate-covered strawberries and fruit arrangements  
    🎁 Gift selection for any occasion
    🚚 Delivery options and scheduling
    🛒 Cart assistance and checkout
    
    Type "help" to see quick options, or tell me what you're looking for!`;
  };

  // Demo response function for fallback scenarios
  const getDemoResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('flower') || lowerMessage.includes('arrangement') || lowerMessage.includes('bouquet')) {
      return "Our fresh flower arrangements are beautifully crafted with premium blooms. You can browse our collection to see all available options, sizes, and seasonal specials.";
    } else if (lowerMessage.includes('fruit') || lowerMessage.includes('chocolate') || lowerMessage.includes('strawberr')) {
      return "Our chocolate-covered strawberries and fruit arrangements are made with the finest ingredients. We offer various sizes and can customize arrangements for special occasions.";
    } else if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping')) {
      return "We offer same-day delivery in most areas and nationwide shipping. Delivery options and fees are calculated at checkout based on your location.";
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('$')) {
      return "Our products are competitively priced with options for every budget. You can view pricing for specific items on their product pages.";
    } else if (lowerMessage.includes('cart') && items.length > 0) {
      return `I see you have ${items.length} item${items.length > 1 ? 's' : ''} in your cart totaling $${getTotal().toFixed(2)}. Would you like help with checkout or do you need more products?`;
    } else {
      return "I'd be happy to help you find the perfect edible arrangement. You can browse our categories or tell me what occasion you're shopping for.";
    }
  };

  // Demo function to show choice buttons (for testing)
  const getDemoChoiceResponse = () => {
    return {
      message: "What would you like to do today?",
      choices: [
        { name: "🌹 Browse Flowers", request: "show me flower arrangements" },
        { name: "🍓 View Fruit Arrangements", request: "show me fruit arrangements" },
        { name: "🎁 Gift Ideas", request: "help me find a gift" },
        { name: "🚚 Delivery Info", request: "tell me about delivery" }
      ]
    };
  };

  const initializeVoiceflowSession = async (sessionUserId: string) => {
    try {
      setIsLoading(true);
      console.log('Initializing Voiceflow session for user:', sessionUserId);
      
      const traces = await interact(sessionUserId, launchRequest);
      console.log('Voiceflow launch traces:', traces);
      
      await processTraces(traces);
      
    } catch (error) {
      console.error('Failed to initialize Voiceflow session:', error);
      
      // Add fallback welcome message
      addMessage({
        content: getWelcomeMessage(),
        sender: 'assistant',
        type: 'text'
      });
      
      // Add system message about connection issue
      setTimeout(() => {
        addMessage({
          content: "I'm having trouble connecting to the full AI system, but I can still help you with basic questions and navigation.",
          sender: 'system',
          type: 'error'
        });
      }, 1000);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      setHasEverBeenInitialized(true);
      try {
        sessionStorage.setItem('chatbot-initialized', 'true');
      } catch (error) {
        console.log('Could not save initialization state to sessionStorage');
      }
    }
  };

  // Enhanced trace processing from ChatPanel
  const processTraces = async (traces: VoiceflowTrace[]) => {
    // Clear any "loading..." messages
    setMessages(prevMessages => prevMessages.filter(m => m.type !== 'loading'));
    
    // Let the dedicated action handler process all traces first
    const processedTraces = await processVoiceflowTraces(traces as any);

    // Loop through and display the remaining, unprocessed visual traces
    for (const trace of processedTraces) {
      // Skip traces that the action handler already took care of
      if (trace.processed) {
        continue;
      }

      switch (trace.type) {
        case 'text':
        case 'speak':
          if (trace.payload?.message) {
            addMessage({ sender: 'assistant', type: 'text', content: trace.payload.message });
          }
          break;
        
        case 'carousel':
          const carouselData = trace.payload as CarouselData;
          if (carouselData?.cards?.length > 0) {
            addMessage({ sender: 'assistant', type: 'carousel', payload: { carouselData } });
          }
          break;

        case 'choice':
          if (trace.payload?.buttons?.length > 0) {
            addMessage({ sender: 'assistant', type: 'buttons', payload: { buttons: trace.payload.buttons } });
          }
          break;

        case 'end':
          setIsLoading(false);
          return; // End processing

        case 'error':
          const errorMessage = trace.payload?.message || 'An error occurred communicating with the assistant.';
          addMessage({ sender: 'system', type: 'error', content: errorMessage, payload: { details: trace.payload?.details } });
          break;
      }
    }

    // Final UI updates
    setIsLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !userId) return;
    
    // Add user message
    addMessage({
      content: content.trim(),
      sender: 'user',
      type: 'text'
    });

    // Check for demo triggers first
    const lowerContent = content.toLowerCase();
    if (!isVoiceflowConfigured() && (lowerContent === 'help' || lowerContent === 'options' || lowerContent === 'menu')) {
      const demoChoice = getDemoChoiceResponse();
      
      setTimeout(() => {
        addMessage({
          content: demoChoice.message,
          sender: 'assistant',
          type: 'choice',
          choices: demoChoice.choices
        });
      }, 1000);
      return;
    }

    setIsLoading(true);

    // If Voiceflow is configured, use it
    if (isVoiceflowConfigured()) {
      try {
                 // Use basic text interaction
         const traces = await interact(userId, { type: 'text', payload: content.trim() });
        await processTraces(traces);
        
      } catch (error) {
        console.error('Error with Voiceflow:', error);
        // Remove loading message
        setMessages(prev => prev.filter(m => m.type !== 'loading'));
        
                 // Add error message
         addMessage({
           content: (error as any)?.message || 'Sorry, I encountered an error. Please try again.',
           sender: 'system',
           type: 'error'
         });
      }
    } else {
      // Fallback to demo responses
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.type !== 'loading'));
        
        const response = getDemoResponse(content);
        addMessage({
          content: response,
          sender: 'assistant',
          type: 'text'
        });
      }, 1500);
    }

    setTimeout(() => setIsLoading(false), 2000);
  };

  // Enhanced button click handler
  const handleChoiceClick = async (choice: { name: string; request: string }) => {
    // Add user message showing their choice
    addMessage({
      content: choice.name,
      sender: 'user',
      type: 'text'
    });

    // Remove choice buttons after selection
    setMessages(prev => prev.filter(msg => msg.type !== 'choice'));

    // Process the choice request
    await handleSendMessage(choice.request);
  };

  // Enhanced Voiceflow button click handler
  const handleVoiceflowButtonClick = async (requestAction: VoiceflowRequestAction, buttonName: string) => {
    if (!userId || isLoading) return;
    
    addMessage({ sender: 'user', type: 'text', content: buttonName });
    
    // Don't remove carousels when clicking show_options - keep them visible
    if (requestAction.payload?.action_type !== 'show_options') {
      setMessages(prev => prev.filter(msg => msg.type !== 'buttons' && msg.type !== 'carousel'));
    }
    
    setIsLoading(true);
    
    try {
             // Use the request action directly
       const traces = await interact(userId, requestAction);
      await processTraces(traces);
      
    } catch (error) {
      console.error('Error with Voiceflow button interaction:', error);
      setMessages(prev => prev.filter(m => m.type !== 'loading'));
      
      addMessage({
        content: 'Sorry, I encountered an error processing that request. Please try again.',
        sender: 'system',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    handleSendMessage(inputValue.trim());
    setInputValue('');
  };

  if (!isChatOpen) return null;

  // RESPONSIVE LAYOUT - Full screen on mobile, popup on larger screens
  return (
    <>
      {/* Mobile Full-Screen Layout (< 768px) */}
      <div className="md:hidden fixed inset-0 z-[9999] bg-white flex flex-col">
        {/* Mobile Header with Close Button */}
        <div className="
          bg-gradient-to-r from-red-600 to-red-700 text-white 
          px-4 py-3 flex items-center justify-between flex-shrink-0
          safe-area-top
        ">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-base">Shopping Assistant</h3>
              <p className="text-sm text-red-100">Online • Ready to help</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={closeChat}
            className="
              w-10 h-10 hover:bg-red-800 rounded-full 
              flex items-center justify-center transition-colors duration-200
            "
            aria-label="Close chat"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Messages Area */}
        <div className="
          flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50
        ">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* Message Bubble */}
              {message.content && (
                <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] px-4 py-3 text-sm leading-relaxed
                    ${message.sender === 'user'
                      ? 'bg-red-600 text-white rounded-lg rounded-br-sm'
                      : message.sender === 'system' 
                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg'
                        : 'bg-white text-gray-800 rounded-lg rounded-bl-sm shadow-sm'
                    }
                  `}>
                    {message.sender === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <UserCircleIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium">Assistant</span>
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              )}
              
              {/* Choice Buttons Outside Message */}
              {message.type === 'choice' && message.choices && (
                <div className="px-4 space-y-2">
                  {message.choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleChoiceClick(choice)}
                      className="
                        w-full px-4 py-3 text-left text-sm font-medium text-red-700
                        bg-white border border-red-200 rounded-lg shadow-sm
                        hover:bg-red-50 hover:border-red-300 hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                        transition-all duration-200
                        flex items-center space-x-2
                      "
                    >
                      <span>{choice.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Voiceflow Buttons */}
              {message.type === 'buttons' && message.payload?.buttons && (
                <div className="px-4 space-y-2">
                  {message.payload.buttons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => handleVoiceflowButtonClick(button.request, button.name)}
                      className="
                        w-full px-4 py-3 text-left text-sm font-medium text-red-700
                        bg-white border border-red-200 rounded-lg shadow-sm
                        hover:bg-red-50 hover:border-red-300 hover:shadow-md
                        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                        transition-all duration-200
                        flex items-center space-x-2
                      "
                    >
                      <span>{button.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product Carousel */}
              {message.type === 'carousel' && message.payload?.carouselData && (
                <div className="px-4">
                  <CompactProductDisplay 
                    carousel={message.payload.carouselData}
                    onButtonClick={handleVoiceflowButtonClick}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          ))}
          
          {/* Mobile Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-lg rounded-bl-sm shadow-sm px-4 py-3 max-w-[85%]">
                <div className="flex items-center space-x-2 mb-2">
                  <UserCircleIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Assistant</span>
                </div>
                <ThinkingEffect />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input Area */}
        <form onSubmit={handleFormSubmit} className="
          p-4 border-t border-gray-200 bg-white flex-shrink-0 safe-area-bottom
        ">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading || !userId}
              className="
                flex-1 px-4 py-3 text-base border border-gray-200 rounded-lg 
                focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
                disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400
              "
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !userId}
              className="
                px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 
                text-white rounded-lg transition-colors duration-200
                flex items-center justify-center flex-shrink-0
                min-w-[52px] disabled:cursor-not-allowed
              "
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Desktop/Tablet Popup Layout (768px+) */}
      <div className="hidden md:block absolute bottom-full right-0 mb-8 w-96 lg:w-[420px] max-w-[calc(100vw-3rem)]">
        {/* Desktop Chat widget container */}
        <div className={`
          bg-white mb-5 shadow-2xl flex flex-col transition-all duration-300 rounded-lg border border-gray-200
          h-[480px] lg:h-[520px]
          ${isMinimized ? 'h-16' : ''}
        `}>
          {/* Header */}
          <div className="
            bg-gradient-to-r from-red-600 to-red-700 text-white 
            px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-lg
          ">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-base">Shopping Assistant</h3>
                <p className="text-sm text-red-100">Online • Ready to help</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Minimize button */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="
                  w-7 h-7 hover:bg-red-800 rounded-full 
                  flex items-center justify-center transition-colors duration-200
                "
                aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              
              {/* Close button */}
              <button
                onClick={closeChat}
                className="
                  w-7 h-7 hover:bg-red-800 rounded-full 
                  flex items-center justify-center transition-colors duration-200
                "
                aria-label="Close chat"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Messages area */}
          {!isMinimized && (
            <div className="
              flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth
            ">
              {messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {/* Message Bubble */}
                  {message.content && (
                    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[80%] px-4 py-3 text-sm leading-relaxed
                        ${message.sender === 'user'
                          ? 'bg-red-600 text-white rounded-lg rounded-br-sm'
                          : message.sender === 'system' 
                            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg'
                            : 'bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm'
                        }
                      `}>
                        {message.sender === 'assistant' && (
                          <div className="flex items-center space-x-2 mb-2">
                            <UserCircleIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">Assistant</span>
                          </div>
                        )}
                        {message.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Desktop Choice Buttons Outside Message */}
                  {message.type === 'choice' && message.choices && (
                    <div className="space-y-2">
                      {message.choices.map((choice, index) => (
                        <button
                          key={index}
                          onClick={() => handleChoiceClick(choice)}
                          className="
                            w-full px-4 py-2 text-left text-sm font-medium text-red-700
                            bg-white border border-red-200 rounded-lg shadow-sm
                            hover:bg-red-50 hover:border-red-300 hover:shadow-md
                            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                            transition-all duration-200
                            flex items-center space-x-2
                          "
                        >
                          <span>{choice.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Desktop Voiceflow Buttons */}
                  {message.type === 'buttons' && message.payload?.buttons && (
                    <div className="space-y-2">
                      {message.payload.buttons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => handleVoiceflowButtonClick(button.request, button.name)}
                          className="
                            w-full px-4 py-2 text-left text-sm font-medium text-red-700
                            bg-white border border-red-200 rounded-lg shadow-sm
                            hover:bg-red-50 hover:border-red-300 hover:shadow-md
                            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                            transition-all duration-200
                            flex items-center space-x-2
                          "
                        >
                          <span>{button.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Desktop Product Carousel */}
                  {message.type === 'carousel' && message.payload?.carouselData && (
                    <div>
                      <CompactProductDisplay 
                        carousel={message.payload.carouselData}
                        onButtonClick={handleVoiceflowButtonClick}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Desktop Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-sm px-4 py-3 max-w-[80%]">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserCircleIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 font-medium">Assistant</span>
                    </div>
                    <ThinkingEffect />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Desktop Input Area */}
          {!isMinimized && (
            <form onSubmit={handleFormSubmit} className="
              p-4 border-t border-gray-200 bg-white flex-shrink-0 rounded-b-lg
            ">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading || !userId}
                  className="
                    flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg 
                    focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
                    disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400
                  "
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading || !userId}
                  className="
                    px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 
                    text-white rounded-lg transition-colors duration-200
                    flex items-center justify-center flex-shrink-0
                    min-w-[44px] disabled:cursor-not-allowed
                  "
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 