'use client';

import React from 'react';
import { AgentConfig, AgentScenario, AgentVoice } from '@/types/voice-agent';
import { Cog8ToothIcon, PlayIcon, WifiIcon, StopIcon } from '@heroicons/react/24/outline';

interface ControlPanelProps {
  config: AgentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
  onRunDemo: () => void;
  onStopDemo: () => void;
  isSimulationRunning: boolean;
}

const scenarioDescriptions: Record<AgentScenario, string> = {
  'order-call': 'A customer calls to place a new order.',
  'missed-call': 'Agent calls back a customer who was missed.',
  'out-of-stock': 'Agent informs a customer about an out-of-stock item.',
  'delivery-check': 'Agent calls a customer to confirm delivery availability.',
};

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, onRunDemo, onStopDemo, isSimulationRunning }) => {
  const handleConfigChange = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-clean p-6 h-full">
      <div className="flex items-center">
        <Cog8ToothIcon className="h-8 w-8 text-primary-600" />
        <h2 className="text-2xl font-semibold text-neutral-800 ml-3">Control Center</h2>
      </div>
      <p className="mt-2 text-sm text-neutral-600">
        Adjust the agent's settings and run a new simulation.
      </p>
      
      <div className="mt-6 space-y-6">
        {/* Scenario Selection */}
        <div>
          <label htmlFor="scenario" className="block text-base font-medium text-neutral-800">
            Demo Scenario
          </label>
          <p className="text-xs text-neutral-500 mt-1">Select the situation to simulate.</p>
          <select
            id="scenario"
            value={config.scenario}
            onChange={(e) => handleConfigChange('scenario', e.target.value as AgentScenario)}
            className="mt-2 block w-full border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-base"
          >
            {Object.keys(scenarioDescriptions).map((key) => (
              <option key={key} value={key}>{scenarioDescriptions[key as AgentScenario]}</option>
            ))}
          </select>
        </div>

        {/* Voice Selection */}
        <div>
          <label htmlFor="voice" className="block text-base font-medium text-neutral-800">
            Agent Voice
          </label>
           <p className="text-xs text-neutral-500 mt-1">Based on Vapi/OpenAI text-to-speech models.</p>
          <select
            id="voice"
            value={config.voice}
            onChange={(e) => handleConfigChange('voice', e.target.value as AgentVoice)}
            className="mt-2 block w-full capitalize border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-base"
          >
            {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Greeting Message */}
        <div>
          <label htmlFor="greeting" className="block text-base font-medium text-neutral-800">
            Initial Greeting
          </label>
          <p className="text-xs text-neutral-500 mt-1">The first thing the agent says to the customer.</p>
          <textarea
            id="greeting"
            rows={4}
            value={config.greeting}
            onChange={(e) => handleConfigChange('greeting', e.target.value)}
            className="mt-2 block w-full border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-base"
          />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-neutral-200 space-y-4">
        {isSimulationRunning ? (
          <button
            onClick={onStopDemo}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
          >
            <StopIcon className="h-5 w-5 mr-2" />
            Stop Simulation
          </button>
        ) : (
          <button
            onClick={onRunDemo}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            Run Live Simulation
          </button>
        )}
        <button
          disabled
          className="w-full flex items-center justify-center px-4 py-3 border border-neutral-300 text-base font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          <WifiIcon className="h-5 w-5 mr-2" />
          Start a Live Call (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;

