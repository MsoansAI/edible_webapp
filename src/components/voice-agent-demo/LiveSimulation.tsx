'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentConfig, VapiMessage } from '@/types/voice-agent';
import { callData } from '@/lib/vapi-call-data';
import PostCallAnalysisCard from './PostCallAnalysisCard';
import { 
  PhoneIcon, UserIcon, CpuChipIcon, CheckCircleIcon, PlayIcon, PauseIcon, 
  CogIcon, InformationCircleIcon, CommandLineIcon, SparklesIcon, ArrowUturnLeftIcon 
} from '@heroicons/react/24/solid';

const postCallAnalysisSteps = [
    { text: "Generating payment link and sending SMS to customer", icon: SparklesIcon, delay: 1500 },
    { text: "Saving secure call recording and transcript to database", icon: SparklesIcon, delay: 2000 },
    { text: "Syncing customer and order data to CRM (Salesforce)", icon: SparklesIcon, delay: 2500 },
    { text: "Updating system analytics dashboard (Grafana)", icon: SparklesIcon, delay: 3000 },
    { text: "Notifying managers of successful high-value order (Slack)", icon: SparklesIcon, delay: 3500 },
];

// A mapping from technical tool names to board-friendly descriptions
const toolCallDescriptions: Record<string, string> = {
  checkCustomerProfile: "Checking for existing customer profile...",
  productRecommendation: "Searching product catalog for customer's request...",
  postOrder: "Saving final order details to database...",
  endCall: "Agent is providing final confirmation and ending the call."
};

const toolResultDescriptions: Record<string, (result: any) => string> = {
  checkCustomerProfile: (result) => {
    try {
      const data = JSON.parse(result);
      if (data.customer?.name) {
        return `**Success:** Customer record found: **${data.customer.name}**.`;
      }
    } catch (e) { /* ignore parse error */ }
    return "**Success:** New customer profile created.";
  },
  productRecommendation: (result) => {
    try {
        const data = JSON.parse(result);
        if(data.products?.length > 0) {
            return `**Success:** Found ${data.products.length} top-rated recommendations.`
        }
    } catch (e) {}
    return "No products found matching criteria."
  },
  postOrder: (result) => {
      try {
        const data = JSON.parse(result);
        if(data.order?.orderNumber) {
            return `**Success:** Order **#${data.order.orderNumber}** confirmed.`
        }
      } catch(e) {}
      return "Order processed successfully."
  },
  endCall: () => "**Success:** Call successfully terminated."
};

const notificationTriggers = {
  customerProfile: ["i found your account", "let me confirm your email"],
  serviceDetails: ["i have you down for", "pickup next tuesday"],
  productRecommendation: ["i have a couple of great options", "how do these sound?"],
  upselling: ["would you like to add anything special", "balloon bundle"],
  giftExperience: ["would you like to include a gift message"],
  orderFinalization: ["let me review your order", "your total comes to"],
  transactionComplete: ["perfect! we're all set", "you'll receive a text confirmation"],
};

const notificationMessages: Record<string, string> = {
  customerProfile: "Checking email address...",
  serviceDetails: "Confirming pickup details...",
  productRecommendation: "Suggesting gift options...",
  upselling: "Suggesting a popular add-on...",
  giftExperience: "Offering a personal gift message...",
  orderFinalization: "Reviewing the order with the customer...",
  transactionComplete: "Preparing the order for checkout...",
};

const getIconForRole = (role: VapiMessage['role']) => {
  switch (role) {
    case 'user': return <UserIcon className="h-5 w-5 text-white" />;
    case 'bot': return <img src="https://jfjvqylmjzprnztbfhpa.supabase.co/storage/v1/object/public/assets//Edible%20Icon%20inverted.png" alt="Assistant" className="h-5 w-5" />;
    case 'system': return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    case 'tool_calls': return <CogIcon className="h-5 w-5 text-gray-500" />;
    case 'tool_call_result': return <CommandLineIcon className="h-5 w-5 text-purple-500" />;
    default: return <PhoneIcon className="h-5 w-5 text-gray-700" />;
  }
};

interface LiveSimulationProps {
  config: AgentConfig;
  isSimulationRunning: boolean;
  onSimulationEnd: () => void;
}

const LiveSimulation: React.FC<LiveSimulationProps> = ({ config, isSimulationRunning, onSimulationEnd }) => {
  const [transcript, setTranscript] = useState<VapiMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<VapiMessage[]>([]);
  const [showAnalysisButton, setShowAnalysisButton] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const postCallTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const triggeredNotificationsRef = useRef<string[]>([]);
  const systemLogsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup function to stop all pending actions
    const stopSimulation = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      postCallTimeoutsRef.current.forEach(clearTimeout);
      postCallTimeoutsRef.current = [];
      audioRef.current?.pause();
    };

    // Reset notification tracker on new simulation
    triggeredNotificationsRef.current = [];

    if (isSimulationRunning && config.scenario === 'order-call-real') {
      audioRef.current?.play();
      
      const messages = callData.messages as VapiMessage[];
      
      timeoutsRef.current = messages.map(message => {
        const delay = message.secondsFromStart * 1000;
        
        return setTimeout(() => {
          if (['user', 'bot'].includes(message.role)) {
            setTranscript(prev => [...prev, message]);
          } else {
            setSystemLogs(prev => [...prev, message]);
          }

          if (message.role === 'bot' && message.message) {
            const lowerCaseMessage = message.message.toLowerCase();
            for (const [category, triggers] of Object.entries(notificationTriggers)) {
              if (!triggeredNotificationsRef.current.includes(category) && triggers.some(trigger => lowerCaseMessage.includes(trigger))) {
                const notification = {
                  role: 'live_notification',
                  message: notificationMessages[category],
                  secondsFromStart: message.secondsFromStart
                };
                setSystemLogs(prev => [...prev, notification as VapiMessage]);
                triggeredNotificationsRef.current.push(category);
                break;
              }
            }
          }
        }, delay);
      });
    }

    return stopSimulation; // This cleanup runs when isSimulationRunning becomes false or component unmounts
  }, [isSimulationRunning, config.scenario]);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scroll({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  useEffect(() => {
    if (systemLogsContainerRef.current) {
      systemLogsContainerRef.current.scroll({
        top: systemLogsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [systemLogs]);

  const handleAudioEnd = () => {
    const finalLogs = [
      { role: 'system', message: 'Saving call recording and transcript...', secondsFromStart: 0 },
      { role: 'system', message: 'Generating payment link and sending SMS...', secondsFromStart: 0 },
      { role: 'system', message: 'Syncing order details to CRM...', secondsFromStart: 0 },
      { role: 'system', message: 'Updating franchisee analytics dashboard...', secondsFromStart: 0 },
      { role: 'system', message: 'Notifying management of high-value order.', secondsFromStart: 0 },
    ];

    let delay = 500;
    
    const postCallTimeouts: NodeJS.Timeout[] = [];

    finalLogs.forEach(log => {
      const timeoutId = setTimeout(() => {
        setSystemLogs(prev => [...prev, log as VapiMessage]);
      }, delay);
      postCallTimeouts.push(timeoutId);
      delay += 750;
    });

    const finalTimeout = setTimeout(() => {
        setShowAnalysisButton(true);
        onSimulationEnd();
    }, delay);
    postCallTimeouts.push(finalTimeout);
    
    postCallTimeoutsRef.current = postCallTimeouts;
  };

  const renderMessageContent = (msg: VapiMessage) => {
    switch (msg.role) {
      case 'system':
        if (msg.message && msg.message.includes('IDENTITY & PERSONA')) {
          return <div className="font-semibold text-blue-600">System initialized</div>;
        }
        return <div className="font-semibold text-green-600">{msg.message}</div>;
      case 'tool_calls':
        const toolName = msg.toolCalls?.[0].function.name || '';
        return <div className="text-gray-600">{toolCallDescriptions[toolName] || `Requesting: ${toolName}`}</div>;
      case 'tool_call_result':
        const resultText = toolResultDescriptions[msg.name || '']?.(msg.result) ?? `Result for ${msg.name} received`;
        return <div className="text-purple-600" dangerouslySetInnerHTML={{ __html: resultText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
      default:
        return msg.message;
    }
  };
  
  return (
    <div className="bg-white border border-neutral-200 shadow-clean p-6 rounded-lg h-full flex flex-col">
      <audio ref={audioRef} src={callData.recordingUrl} onEnded={handleAudioEnd} />
      
      <header className="flex justify-between items-center border-b border-neutral-200 pb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-neutral-800">Live Simulation</h2>
        {isSimulationRunning && (
          <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium">LIVE</span>
          </div>
        )}
      </header>

      <div className="relative flex-grow mt-4 min-h-0">
        <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"
            animate={{ filter: showAnalysis ? 'blur(4px)' : 'blur(0px)', opacity: showAnalysis ? 0.7 : 1 }}
            transition={{ duration: 0.5 }}
        >
          {/* Left: Transcript Column */}
          <div className="flex flex-col min-h-0">
              <h3 className="text-lg font-medium text-neutral-800 flex items-center mb-4 flex-shrink-0">
                <PhoneIcon className="h-6 w-6 mr-2 text-neutral-500"/>
                Call Transcript
              </h3>
              <div ref={transcriptContainerRef} className="flex-grow overflow-y-auto space-y-4 pr-2 bg-gray-50 p-3 rounded-lg">
                {transcript.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 animate-fade-in text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'bot' && <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary-600">{getIconForRole(msg.role)}</div>}
                    <div className={`px-4 py-2 max-w-md rounded-lg ${msg.role === 'bot' ? 'bg-neutral-100 text-neutral-800' : 'bg-blue-500 text-white'}`}>
                      {msg.message}
                    </div>
                    {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500">{getIconForRole(msg.role)}</div>}
                  </div>
                ))}
                {!isSimulationRunning && transcript.length === 0 && (
                  <div className="text-center text-neutral-400 h-full flex items-center justify-center">Click "Run Live Simulation" to begin.</div>
                )}
              </div>
          </div>

          {/* Right: System Logs Column */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-lg font-medium text-neutral-800 flex items-center mb-4 flex-shrink-0">
              <CpuChipIcon className="h-6 w-6 mr-2 text-neutral-500"/>
              System Activity
            </h3>
            <div ref={systemLogsContainerRef} className="flex-grow overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-lg pr-2">
              {systemLogs
                .sort((a, b) => a.secondsFromStart - b.secondsFromStart)
                .map((msg, index) => {
                  if (msg.role === 'live_notification') {
                    return (
                      <div key={index} className="flex items-center gap-3 animate-fade-in text-sm">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                          <SparklesIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-grow font-semibold text-green-800">{msg.message}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="flex items-center gap-3 animate-fade-in text-sm">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">{getIconForRole(msg.role)}</div>
                      <div className="flex-grow">{renderMessageContent(msg)}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
        
        {/* Analysis Card - now positioned relative to the parent grid */}
        <AnimatePresence>
          {showAnalysis && <PostCallAnalysisCard />}
        </AnimatePresence>
      </div>
      
      {/* Footer for analysis button */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-neutral-200 text-center">
        {showAnalysisButton && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowAnalysis(prev => !prev)}
            className={`inline-flex items-center px-6 py-2 font-semibold rounded-lg shadow-md transition-colors ${
                showAnalysis
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {showAnalysis ? (
                <>
                    <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
                    Return to Simulation
                </>
            ) : (
              'View Call Analysis'
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default LiveSimulation;

