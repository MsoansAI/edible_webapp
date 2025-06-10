'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import ElegantChatAssistant from '@/components/ElegantChatAssistant';

export default function ChatTestPage() {
  const { isChatOpen, toggleChat } = useUIStore();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    addLog('Chat test page loaded');
    addLog(`Initial isChatOpen: ${isChatOpen}`);
  }, []);

  useEffect(() => {
    addLog(`isChatOpen changed to: ${isChatOpen}`);
  }, [isChatOpen]);

  const handleManualToggle = () => {
    addLog('Manual toggle button clicked');
    toggleChat();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chat Widget Test Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Chat Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current State
                </label>
                <div className="text-lg font-mono">
                  isChatOpen: <span className={isChatOpen ? 'text-green-600' : 'text-red-600'}>
                    {isChatOpen ? 'true' : 'false'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleManualToggle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 transition-colors"
              >
                Manual Toggle Chat ({isChatOpen ? 'Close' : 'Open'})
              </button>

              <div className="text-xs text-gray-500">
                This button directly calls toggleChat() from useUIStore
              </div>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            
            <div className="bg-gray-50 p-4 h-64 overflow-y-auto text-sm font-mono">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 text-gray-800">
                  {log}
                </div>
              ))}
            </div>

            <button
              onClick={() => setLogs([])}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 mt-8">
          <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Check the browser console for any JavaScript errors</li>
            <li>Try clicking the floating chat button (bottom-right corner)</li>
            <li>Try the manual toggle button above</li>
            <li>Watch the debug logs for state changes</li>
            <li>If the floating button doesn't work, there's a React event issue</li>
            <li>If the manual button works but floating doesn't, it's a component-specific issue</li>
          </ol>
        </div>
      </div>

      {/* Render the actual chat assistant */}
      <ElegantChatAssistant />
    </div>
  );
} 