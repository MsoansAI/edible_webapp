'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { HeartIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import TypewriterText from './TypewriterText';
import ThinkingEffect from './ThinkingEffect';
import {
  interact,
  generateUserId,
  launchRequest,
  createTextRequest,
  VoiceflowTrace,
  VoiceflowRequestAction,
  saveTranscript,
  sendMessageWithFullContext
} from '@/lib/voiceflow';
import toast from 'react-hot-toast';
import { useVoiceflowAuth } from '@/hooks/useVoiceflowAuth'
import { processVoiceflowTraces } from '@/lib/voiceflowActions'

// --- Begin Carousel & Button Types ---
export interface VoiceflowButton {
  name: string;
  request: VoiceflowRequestAction;
}

export interface CarouselCardButton extends VoiceflowButton {} // Alias for clarity, structure is the same

export interface CarouselCard {
  id: string; // Or any unique identifier for the card
  title: string;
  description: { slate?: any[]; text: string }; // Prefer text for simplicity
  imageUrl?: string;
  buttons?: CarouselCardButton[];
  metadata?: any; // For card-specific metadata if needed
}

export interface CarouselData {
  layout?: string; // e.g., "Carousel"
  metadata?: { carouselType?: string; [key: string]: any };
  cards: CarouselCard[];
}
// --- End Carousel & Button Types ---

export interface ChatMessageUI {
  id: string;
  sender: 'user' | 'agent' | 'system';
  type: 'text' | 'error' | 'loading' | 'buttons' | 'carousel';
  content?: string;
  payload?: {
    buttons?: VoiceflowButton[];
    carouselData?: CarouselData;
    details?: any; // For error details
    [key: string]: any;
  };
  timestamp: Date;
}

// Enhanced Product Grid Display Component (2x2 layout)
const ProductGridDisplay: React.FC<{ 
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
    <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center">
        <SparklesIcon className="h-5 w-5 text-primary-600 mr-2" />
        Featured Products
      </h4>
      
      {/* Enhanced 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {carousel.cards.slice(0, 4).map((card, index) => (
          <div key={card.id || `product-${index}`} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
            {/* Product Image */}
            {card.imageUrl && (
              <div className="relative w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100">
                <Image 
                  src={card.imageUrl} 
                  alt={card.title} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>
            )}
            
            {/* Product Info */}
            <div className="p-3">
              <h5 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2 leading-tight" title={card.title}>
                {card.title}
              </h5>
              <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                {card.description?.text || ''}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {card.buttons && card.buttons.length > 0 && (
                  <>
                    {card.buttons.map((button, btnIndex) => {
                      // Check button action type for different styling
                      const isAddToCart = button.request.payload?.action_type === 'add_to_cart';
                      const isShowOptions = button.request.payload?.action_type === 'show_options';
                      
                      return (
                        <button
                          key={`${card.id}-btn-${btnIndex}`}
                          onClick={() => onButtonClick(button.request, button.name)}
                          disabled={isLoading}
                          className={`text-xs py-2 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95 ${
                            isAddToCart 
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                              : isShowOptions
                              ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300 shadow-sm hover:shadow-md'
                              : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {isAddToCart && <ShoppingCartIcon className="w-4 h-4" />}
                          <span>{button.name}</span>
                        </button>
                      );
                    })}
                    
                    {/* Quick Add to Cart (if not already present) */}
                    {!card.buttons.some(btn => btn.request.payload?.action_type === 'add_to_cart') && (
                      <button
                        onClick={(e) => handleAddToCart(card, e)}
                        className="text-xs py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        <span>Quick Add</span>
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
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <span>View all {carousel.cards.length} products</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Enhanced Options Modal/Popup Component with Horizontal Scroll
const OptionsModalDisplay: React.FC<{ 
  carousel: CarouselData, 
  onButtonClick: (request: VoiceflowRequestAction, buttonName: string) => void, 
  isLoading: boolean,
  onClose: () => void
}> = ({ carousel, onButtonClick, isLoading, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current && carousel.cards.length > 0) {
      const newIndex = direction === 'left' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(carousel.cards.length - 1, currentIndex + 1);
      
      setCurrentIndex(newIndex);
      
      const cardWidth = scrollContainerRef.current.children[0]?.clientWidth || 0;
      const scrollPosition = newIndex * (cardWidth + 12); // 12px for gap
      scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  if (!carousel || !carousel.cards || carousel.cards.length === 0) {
    return null;
  }

  const parentProduct = carousel.metadata?.parentProduct;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Choose Your Option</h3>
            {parentProduct && (
              <p className="text-sm text-gray-600">{parentProduct.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close options"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Options Content */}
        <div className="p-4">
          {/* Navigation Indicators */}
          {carousel.cards.length > 1 && (
            <div className="flex justify-center mb-4 space-x-2">
              {carousel.cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    const cardWidth = scrollContainerRef.current?.children[0]?.clientWidth || 0;
                    const scrollPosition = index * (cardWidth + 12);
                    scrollContainerRef.current?.scrollTo({ left: scrollPosition, behavior: 'smooth' });
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Scrollable Options Container */}
          <div className="relative">
            {carousel.cards.length > 1 && (
              <>
                <button 
                  onClick={() => scroll('left')} 
                  disabled={currentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-md -ml-3 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous option"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-gray-700" />
                </button>
                
                <button 
                  onClick={() => scroll('right')} 
                  disabled={currentIndex === carousel.cards.length - 1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-md -mr-3 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next option"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-700" />
                </button>
              </>
            )}
            
            <div 
              ref={scrollContainerRef} 
              className="flex space-x-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {carousel.cards.map((card, index) => (
                <div 
                  key={card.id || `option-${index}`} 
                  className="flex-shrink-0 w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden snap-start"
                >
                  {/* Option Image */}
                  {card.imageUrl && (
                    <div className="relative w-full h-40 bg-gray-100">
                      <Image 
                        src={card.imageUrl} 
                        alt={card.title} 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  
                  {/* Option Details */}
                  <div className="p-4">
                    <h4 className="font-semibold text-base text-gray-800 mb-2">{card.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {card.description?.text || ''}
                    </p>
                    
                    {/* Option Buttons */}
                    {card.buttons && card.buttons.length > 0 && (
                      <div className="space-y-2">
                        {card.buttons.map((button, btnIndex) => (
                          <button
                            key={`${card.id}-option-btn-${btnIndex}`}
                            onClick={() => {
                              onButtonClick(button.request, button.name);
                              onClose(); // Close modal after selection
                            }}
                            disabled={isLoading}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              button.request.payload?.action_type === 'select_option'
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : button.request.payload?.action_type === 'add_to_cart'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                          >
                            {button.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChatPanel() {
  const { isChatOpen, closeChat, toggleChat } = useUIStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsCarouselData, setOptionsCarouselData] = useState<CarouselData | null>(null);
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const [currentTurnMessages, setCurrentTurnMessages] = useState<string[]>([]);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const chatPanelBodyRef = useRef<HTMLDivElement>(null);
  const hasLaunchedRef = useRef(false);
  const [cartVersion, setCartVersion] = useState(0);

  // Example auth state - replace with your actual auth system
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Initialize Voiceflow auth sync (only if userId exists)
  const { syncAuthState, syncCartState } = useVoiceflowAuth({
    isAuthenticated,
    user,
    userID: userId || 'anonymous' // Handle null userId
  })

  // Scroll detection to show/hide previous turns
  useEffect(() => {
    const handleScroll = () => {
      if (!chatPanelBodyRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatPanelBodyRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      
      setIsScrollingUp(!isAtBottom);
    };

    const scrollContainer = chatPanelBodyRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen && chatPanelBodyRef.current) {
      chatPanelBodyRef.current.scrollTop = chatPanelBodyRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen && !userId) {
      const newUserId = generateUserId();
      setUserId(newUserId);
      hasLaunchedRef.current = false;
      setMessages([]);
    }
  }, [isChatOpen, userId]);

  useEffect(() => {
    if (isChatOpen && userId && !hasLaunchedRef.current && !messages.some(m => m.type ==='loading')) {
      hasLaunchedRef.current = true;
      setIsLoading(true);
      
      // Start initial turn
      setCurrentTurnMessages(['launch-loading']);
      
      setMessages([{ id: 'launch-loading', sender: 'system', type: 'loading', content: 'Connecting...', timestamp: new Date() }]);
      interact(userId, launchRequest)
        .then(processTraces)
        .catch(handleInteractionError);
    }
  }, [isChatOpen, userId]);

  const addMessageToList = (message: Omit<ChatMessageUI, 'id' | 'timestamp'>) => {
    const newMessage = { ...message, id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, timestamp: new Date() };
    setMessages((prevMessages) => [
      ...prevMessages.filter(m => m.type !== 'loading' || m.id === 'launch-loading'),
      newMessage,
    ]);
    
    // Track current turn messages for visual effects
    setCurrentTurnMessages(prev => [...prev, newMessage.id]);
    
    // Track latest message for styling
    if (message.type === 'text' && message.sender === 'agent') {
      setLatestMessageId(newMessage.id);
    }
  };

  // Start a new conversation turn (when user sends a message)
  const startNewTurn = () => {
    // Clear current turn to fade previous messages
    setCurrentTurnMessages([]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatPanelBodyRef.current) {
        chatPanelBodyRef.current.scrollTop = chatPanelBodyRef.current.scrollHeight;
      }
    }, 50);
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatPanelBodyRef.current) {
        chatPanelBodyRef.current.scrollTop = chatPanelBodyRef.current.scrollHeight;
      }
    }, 50);
  };

  const getMessageStyling = (msg: ChatMessageUI, index: number, agentTextMessages: ChatMessageUI[]) => {
    if (msg.type !== 'text' || msg.sender !== 'agent') {
      return { textSize: 'text-base md:text-lg', opacity: 'opacity-100' };
    }

    const agentTextIndex = agentTextMessages.findIndex(m => m.id === msg.id);
    const isLatest = agentTextIndex === agentTextMessages.length - 1;
    const isPrevious = agentTextIndex === agentTextMessages.length - 2;
    const isAntepenultimate = agentTextIndex === agentTextMessages.length - 3;

    if (isLatest) {
      return { textSize: 'text-xl md:text-2xl', opacity: 'opacity-100' };
    } else if (isPrevious) {
      return { textSize: 'text-base md:text-lg', opacity: 'opacity-70' };
    } else if (isAntepenultimate) {
      return { textSize: 'text-base md:text-lg', opacity: 'opacity-50' };
    } else {
      return { textSize: 'text-sm md:text-base', opacity: 'opacity-30' };
    }
  };

  const processTraces = async (traces: VoiceflowTrace[]) => {
    // 1. Clear any "loading..." messages
    setMessages(prevMessages => prevMessages.filter(m => m.type !== 'loading'));
    
    // 2. Let the dedicated action handler process all traces first
    // This function will handle custom actions like 'clear-cart', 'navigate', etc.
    const processedTraces = await processVoiceflowTraces(traces);

    // 3. Loop through and display the remaining, unprocessed visual traces
    for (const trace of processedTraces) {
      // Skip traces that the action handler already took care of
      if (trace.processed) {
        continue;
      }

      switch (trace.type) {
        case 'text':
        case 'speak':
          if (trace.payload?.message) {
            addMessageToList({ sender: 'agent', type: 'text', content: trace.payload.message });
          }
          break;
        
        case 'carousel':
          const carouselData = trace.payload as CarouselData;
          if (carouselData?.cards?.length > 0) {
            addMessageToList({ sender: 'agent', type: 'carousel', payload: { carouselData } });
          }
          break;

        case 'choice':
          if (trace.payload?.buttons?.length > 0) {
            addMessageToList({ sender: 'agent', type: 'buttons', payload: { buttons: trace.payload.buttons } });
          }
          break;

        case 'end':
          // Optionally, you can add a system message for the end of a conversation
          // addMessageToList({ sender: 'system', type: 'text', content: 'Conversation ended.' });
          setIsLoading(false);
          return; // End processing

        case 'error':
          const errorMessage = trace.payload?.message || 'An error occurred communicating with the assistant.';
          addMessageToList({ sender: 'system', type: 'error', content: errorMessage, payload: { details: trace.payload?.details } });
          break;
        
        // No default case needed, we intentionally ignore other traces like 'visual', etc.
      }
    }

    // 4. Final UI updates
    setIsLoading(false);
    // Auto-scroll to show new messages
    setTimeout(() => {
      if (chatPanelBodyRef.current) {
        chatPanelBodyRef.current.scrollTop = chatPanelBodyRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleInteractionError = (error: any) => {
    setMessages(prev => prev.filter(m => m.id !== 'launch-loading' && m.type !== 'loading'));
    addMessageToList({
      sender: 'system',
      type: 'error',
      content: (error?.message && typeof error.message === 'string' && error.message.includes('Voiceflow client not configured')) 
                 ? 'Chatbot is not configured. Please set Voiceflow API Key.' 
                 : error?.message || 'An unexpected error occurred while communicating with the assistant.',
      payload: { details: error?.response?.data || error }
    });
    setIsLoading(false);
  };

  // Enhanced send message function that includes context
  const sendMessageWithAuth = async (message: string) => {
    if (!message.trim()) return
    
    // Add user message to chat
    const userMessage: ChatMessageUI = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Send message with authentication and cart context
      const traces = await sendMessageWithFullContext(userId || 'anonymous', message, {
        // Optional: add any additional context here
        // Remove sessionSource as it's not part of ChatContext
      })
      
      // Process traces as before...
      await processTraces(traces)
      
    } catch (error) {
      console.error('Error sending message:', error)
      // ... existing error handling ...
    } finally {
      setIsLoading(false)
    }
  }

  // Example: Update auth state when user logs in/out
  const handleAuthChange = (newAuthState: boolean, userData?: any) => {
    setIsAuthenticated(newAuthState)
    setUser(userData)
    // Sync will happen automatically via useVoiceflowAuth hook
  }

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !userId || isLoading) return;
    
    const userMessageContent = inputValue.trim();
    addMessageToList({ sender: 'user', type: 'text', content: userMessageContent });
    setInputValue('');
    setIsLoading(true);
    addMessageToList({ sender: 'system', type: 'loading', content: 'Thinking...' });
    
    // Auto-scroll to bottom when starting new turn
    startNewTurn();
    
    try {
      // Use the enhanced function that includes full context (cart + auth)
      const authDetails = user ? {
        userId: user.id,
        email: user.email,
        authUserId: user.id
      } : undefined;
      
      const traces = await sendMessageWithFullContext(userId, userMessageContent, authDetails);
      await processTraces(traces as any);
      
      // Save transcript after user message
      saveTranscript(userId).catch(error => {
        console.error('Error saving transcript after user message:', error);
      });
    } catch (error) {
      handleInteractionError(error);
    } 
  };

  const handleButtonChoiceClick = async (requestAction: VoiceflowRequestAction, buttonName: string) => {
    if (!userId || isLoading) return;
    
    addMessageToList({ sender: 'user', type: 'text', content: buttonName });
    
    // Don't remove carousels when clicking show_options - keep them visible
    if (requestAction.payload?.action_type !== 'show_options') {
      setMessages(prev => prev.filter(msg => msg.type !== 'buttons' && msg.type !== 'carousel'));
    }
    
    setIsLoading(true);
    addMessageToList({ sender: 'system', type: 'loading', content: 'Thinking...' });
    
    // Auto-scroll to bottom when starting new turn
    startNewTurn();
    
    try {
      // For button clicks, use the base interact function but with full context
      const cartStore = useCartStore.getState();
      const cartData = {
        items: cartStore.items || [],
        summary: {
          itemCount: cartStore.items?.length || 0,
          subtotal: cartStore.getTotal() || 0,
          tax: (cartStore.getTotal() || 0) * 0.0825,
          shipping: (cartStore.getTotal() || 0) >= 65 ? 0 : 9.99,
          total: (cartStore.getTotal() || 0) + ((cartStore.getTotal() || 0) * 0.0825) + ((cartStore.getTotal() || 0) >= 65 ? 0 : 9.99),
          freeShippingEligible: (cartStore.getTotal() || 0) >= 65
        },
        itemDetails: (cartStore.items || []).map((item: any) => ({
          productId: item.product.id,
          productIdentifier: item.product.product_identifier,
          productName: item.product.name,
          option: item.option ? {
            id: item.option.id,
            name: item.option.option_name,
            price: item.option.price
          } : null,
          quantity: item.quantity,
          unitPrice: item.option ? item.option.price : item.product.base_price,
          totalPrice: (item.option ? item.option.price : item.product.base_price) * item.quantity
        }))
      };

      const context = {
        isAuthenticated: !!user,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        cartItemCount: cartStore.items?.length || 0,
        cartTotal: cartStore.getTotal() || 0,
        cartData
      };

      const traces = await interact(userId, requestAction, context);
      await processTraces(traces as any);
    } catch (error) {
      handleInteractionError(error);
    }
  };

  const handleCloseOptionsModal = () => {
    setShowOptionsModal(false);
    setOptionsCarouselData(null);
  };

  useEffect(() => {
    // This effect listens for our custom cart update event
    const handleCartUpdate = () => {
      console.log('Cart update event received, forcing re-render.');
      setCartVersion(prevVersion => prevVersion + 1);
    };

    window.addEventListener('cart-updated', handleCartUpdate);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      {/* Chat Banner - Always visible at bottom when closed, integrated at top when open */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isChatOpen ? 'transform translate-y-full opacity-0 pointer-events-none' : 'transform translate-y-0 opacity-100'}`}>
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 text-white shadow-2xl border-t-2 border-primary-500">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4">
              {/* Left side - Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold">AI Shopping Assistant</h3>
                    <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Get personalized recommendations & instant help</p>
                  </div>
                </div>
                
                               {/* Status indicator */}
               <div className="hidden md:flex items-center space-x-2">
                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                 <span className="text-xs md:text-sm font-medium">Online & Ready</span>
               </div>
              </div>

              {/* Right side - Open button */}
              <button
                onClick={() => toggleChat()}
                className="flex items-center space-x-2 sm:space-x-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 group"
                aria-label="Open chat"
              >
                <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden md:inline font-semibold text-white text-sm md:text-base">Start Chatting</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-1/2 xl:w-1/2 bg-white shadow-4xl z-40 flex flex-col md:border-l md:border-gray-200 transition-all duration-500 ease-in-out pt-20 md:pt-24 ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
      {/* Simple Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={closeChat}
          className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors duration-200 shadow-md"
          aria-label="Close chat"
        >
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

            <div ref={chatPanelBodyRef} className="flex-1 overflow-y-auto scroll-smooth px-4 pb-4 pt-24 md:pt-16 relative">
          
          {/* Scroll Up Indicator - shows when there are previous turns to see */}
          {!isScrollingUp && currentTurnMessages.length > 0 && messages.some(m => !currentTurnMessages.includes(m.id)) && (
            <div className="sticky top-0 z-10 mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm animate-fade-in-up text-center">
              <div className="flex items-center justify-center space-x-2">
                <span>👆 Scroll up to see previous conversation</span>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3 min-h-full">
            {/* Current Conversation Messages */}
            {messages.map((msg, index) => {
              // Skip rendering if we're showing an options modal and this is the triggering carousel
              if (showOptionsModal && msg.type === 'carousel') {
                return null;
              }

              // Determine visibility: show all when scrolling up, only current turn when at bottom
              const isCurrentTurn = currentTurnMessages.includes(msg.id);
              const shouldShow = isScrollingUp || isCurrentTurn;

              // If message shouldn't be shown, return null (completely hidden)
              if (!shouldShow) {
                return null;
              }

              const styling = getMessageStyling(msg, index, messages.filter(m => m.type === 'text' && m.sender === 'agent'));

              return (
                <div
                  key={msg.id}
                  className={`flex transition-all duration-300 ease-in-out ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  } ${isCurrentTurn ? 'opacity-100' : 'opacity-75'}`}
                >
                  {(msg.type === 'text' || msg.type === 'error' || (msg.type === 'loading' && msg.sender === 'system')) && (
                    <div className={`max-w-[85%] p-2 break-words transition-all duration-500 ease-in-out ${styling.textSize} ${
                      msg.sender === 'user' ? 'text-primary-700 font-medium animate-fade-in-up' :
                      msg.sender === 'agent' ? 'text-gray-800' :
                      msg.type === 'error' ? 'text-red-700 animate-fade-in-up' :
                      msg.type === 'loading' ? 'text-gray-500 italic text-sm text-center w-full' :
                      'text-blue-700 animate-fade-in-up' // Other system messages
                    }`}>
                      {msg.type === 'loading' ? (
                        <ThinkingEffect />
                      ) : msg.sender === 'agent' && msg.type === 'text' ? (
                        <TypewriterText 
                          text={msg.content || ''} 
                          speed={30}
                          className={styling.textSize}
                        />
                      ) : (
                        msg.content
                      )}
                      {msg.type === 'error' && msg.payload?.details && (
                        <details className="mt-3 text-xs cursor-pointer">
                          <summary className="font-semibold hover:text-red-800 transition-colors">Details</summary>
                          <pre className="whitespace-pre-wrap bg-white/80 p-3 rounded-lg mt-2 text-gray-600 border border-red-200">{JSON.stringify(msg.payload.details, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  )}
                  
                  {msg.type === 'buttons' && msg.payload?.buttons && (
                    <div className="w-full grid grid-cols-2 gap-3 mt-3 self-start">
                      {msg.payload.buttons.map((button: VoiceflowButton, index: number) => (
                        <button
                          key={`${msg.id}-button-${index}`}
                          onClick={() => handleButtonChoiceClick(button.request, button.name)}
                          disabled={isLoading}
                          className="bg-white border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50 text-primary-700 hover:text-primary-900 font-semibold text-base md:text-lg py-4 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-center"
                        >
                          {button.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {msg.type === 'carousel' && msg.payload?.carouselData && (() => {
                    const carouselType = msg.payload.carouselData.metadata?.carouselType;
                    const carouselErrorMessage = msg.payload.carouselData.metadata?.message;

                    if (carouselType === 'error') {
                      return (
                        <div className="w-full max-w-[85%] p-3 rounded-lg bg-red-100 text-red-700 border border-red-300 self-start mt-1">
                          <p className="font-semibold">Error</p>
                          <p>{carouselErrorMessage || 'An error occurred displaying this content.'}</p>
                        </div>
                      );
                    }

                    // Always show products carousel with enhanced 2x2 grid
                    return (
                      <div className="w-full mt-1 self-start">
                        <ProductGridDisplay carousel={msg.payload.carouselData} onButtonClick={handleButtonChoiceClick} isLoading={isLoading} />
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        
      </div>

      <form onSubmit={(e) => {
        e.preventDefault()
        sendMessageWithAuth(inputValue)
      }} className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={userId ? (isLoading && !messages.some(m => m.type === 'buttons' || m.type ==='carousel') ? "Thinking..." : "Type your message...") : "Connecting..."}
            className="input-field flex-1 px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl shadow-sm"
                          disabled={isLoading || !userId || messages.some(m => m.type === 'buttons')}
              onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
            />
            <button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" disabled={isLoading || !userId || !inputValue.trim() || messages.some(m => m.type === 'buttons')}>
              <PaperAirplaneIcon className="h-5 w-5"/>
            </button>
        </div>
              </form>

      {/* Debug panel to show current context (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-gray-100 text-xs">
          <div>Auth: {isAuthenticated ? '✅ Logged in' : '❌ Guest'}</div>
          <div>User: {user?.name || 'None'}</div>
          <div>Cart: {useCartStore.getState().items.length} items</div>
        </div>
      )}
    </div>

      {/* Options Modal */}
      {showOptionsModal && optionsCarouselData && (
        <OptionsModalDisplay 
          carousel={optionsCarouselData as CarouselData} 
          onButtonClick={handleButtonChoiceClick} 
          isLoading={isLoading}
          onClose={handleCloseOptionsModal}
        />
      )}
    </>
  );
} 