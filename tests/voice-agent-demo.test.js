import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveSimulation from '@/components/voice-agent-demo/LiveSimulation';
import { callData } from '@/lib/vapi-call-data'; // Mock data

// Mock the AgentConfig props
const mockConfig = {
  voice: 'alloy',
  greeting: 'Hello...',
  scenario: 'order-call-real',
};

// Mock the audio element
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
});

describe('LiveSimulation with a Two-Column Layout', () => {

  it('renders the audio player with the correct recording URL', () => {
    render(<LiveSimulation config={mockConfig} />);
    const audioPlayer = screen.getByTestId('audio-player');
    expect(audioPlayer).toBeInTheDocument();
    expect(audioPlayer).toHaveAttribute('src', callData.recordingUrl);
  });

  it('renders user and bot messages in the transcript column', async () => {
    render(<LiveSimulation config={mockConfig} />);
    
    // Use `getByRole` with a `name` that matches the `aria-label` or heading
    const transcriptColumn = screen.getByRole('heading', { name: /Call Transcript/i }).closest('div');

    await waitFor(() => {
      // Check for user message within the transcript column
      const userMessage = screen.getByText("I'd like to book order a pickup");
      expect(transcriptColumn).toContainElement(userMessage);
    }, { timeout: 5000 });

    await waitFor(() => {
      // Check for bot message within the transcript column
      const botMessage = screen.getByText(/Perfect. I'd be happy to help you with a pickup order./);
      expect(transcriptColumn).toContainElement(botMessage);
    }, { timeout: 5000 });
  });

  it('renders tool calls and system messages in the system activity column', async () => {
    render(<LiveSimulation config={mockConfig} />);
    const systemActivityColumn = screen.getByRole('heading', { name: /System Activity/i }).closest('div');

    await waitFor(() => {
      // Check for a tool call
      const toolCall = screen.getByText(/Requesting: checkCustomerProfile/);
      expect(systemActivityColumn).toContainElement(toolCall);
    }, { timeout: 10000 });

    await waitFor(() => {
      // Check for a tool result
      const toolResult = screen.getByText(/Result for checkCustomerProfile received/);
      expect(systemActivityColumn).toContainElement(toolResult);
    }, { timeout: 12000 });
  });

  it('displays the PostCallAnalysisCard after the call finishes', async () => {
    render(<LiveSimulation config={mockConfig} />);
    
    // Wait for the analysis card to appear
    await waitFor(() => {
      const analysisTitle = screen.getByText('Post-Call Analysis');
      expect(analysisTitle).toBeInTheDocument();
    }, { timeout: 20000 }); // Timeout should be long enough for the whole simulation

    // Check for a KPI on the card
    expect(screen.getByText('Revenue Generated')).toBeInTheDocument();
    expect(screen.getByText('$97.41')).toBeInTheDocument();
  });
}); 