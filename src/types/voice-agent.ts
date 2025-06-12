export type AgentVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export type AgentScenario = 'order-call' | 'missed-call' | 'out-of-stock' | 'delivery-check' | 'order-call-real';

export interface AgentConfig {
  voice: AgentVoice;
  greeting: string;
  scenario: AgentScenario;
}

// Types for the Vapi call data structure
export type MessageRole = 'system' | 'user' | 'bot' | 'tool_calls' | 'tool_call_result' | 'live_notification';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface VapiMessage {
  role: MessageRole;
  time?: number;
  message?: string;
  secondsFromStart: number;
  // For tool calls
  toolCalls?: ToolCall[];
  // For tool call results
  name?: string;
  result?: string;
  toolCallId?: string;
  // For bot/user messages
  duration?: number;
}

export interface VapiCallData {
  id: string;
  recordingUrl: string;
  summary: string;
  messages: VapiMessage[];
} 