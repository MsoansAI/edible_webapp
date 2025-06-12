'use client';

import React, { useState, useCallback } from 'react';
import ControlPanel from '@/components/voice-agent-demo/ControlPanel';
import LiveSimulation from '@/components/voice-agent-demo/LiveSimulation';
import AnalyticsDashboard from '@/components/voice-agent-demo/AnalyticsDashboard';
import { AgentConfig } from '@/types/voice-agent';

const VoiceAgentDemoPage = () => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    voice: 'alloy',
    greeting: 'Hello, thank you for calling Edible. How can I help you today?',
    scenario: 'order-call-real',
  });

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationId, setSimulationId] = useState(0);

  const handleRunDemo = useCallback(() => {
    if (isSimulationRunning) return;
    
    setSimulationId(prevId => prevId + 1);
    setIsSimulationRunning(true);
  }, [isSimulationRunning]);
  
  const handleStopDemo = useCallback(() => {
    setIsSimulationRunning(false);
  }, []);

  const handleSimulationEnd = useCallback(() => {
    setIsSimulationRunning(false);
  }, []);

  return (
    <div className="bg-neutral-50 min-h-screen">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Interactive Voice Agent Showcase
          </h1>
          <p className="mt-1 text-base text-neutral-600">
            A real-time demonstration of the AI-powered customer service agent for franchisees.
          </p>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Controls */}
          <div className="lg:col-span-3">
            <ControlPanel 
              config={agentConfig} 
              setConfig={setAgentConfig} 
              onRunDemo={handleRunDemo}
              onStopDemo={handleStopDemo}
              isSimulationRunning={isSimulationRunning}
            />
          </div>

          {/* Center Panel: Live Simulation */}
          <div className="lg:col-span-6 h-[85vh]">
            <LiveSimulation 
              key={simulationId} 
              config={agentConfig} 
              isSimulationRunning={isSimulationRunning}
              onSimulationEnd={handleSimulationEnd}
            />
          </div>

          {/* Right Panel: Analytics */}
          <div className="lg:col-span-3">
            <AnalyticsDashboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoiceAgentDemoPage;

