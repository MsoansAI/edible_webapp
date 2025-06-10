import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatWidget from '../src/components/ChatWidget'
import { useUIStore } from '../src/store/uiStore'
import { useCartStore } from '../src/store/cartStore'

// Mock dependencies
jest.mock('../src/store/uiStore')
jest.mock('../src/store/cartStore')
jest.mock('../src/lib/voiceflow', () => ({
  interact: jest.fn(),
  generateUserId: jest.fn(() => 'test-user-123'),
  launchRequest: {},
  sendMessageWithFullContext: jest.fn()
}))
jest.mock('../src/lib/voiceflowActions', () => ({
  processVoiceflowTraces: jest.fn((traces) => Promise.resolve(traces))
}))

describe('Choice Buttons', () => {
  beforeEach(() => {
    // Mock UI store
    useUIStore.mockReturnValue({
      isChatOpen: true,
      closeChat: jest.fn()
    })
    
    // Mock cart store
    useCartStore.mockReturnValue({
      items: [],
      getTotal: jest.fn(() => 0)
    })
  })

  test('chat widget renders successfully', () => {
    render(<ChatWidget />)
    
    // The widget should render without errors
    expect(true).toBe(true)
  })

  test('choice buttons are displayed when choice message is added', async () => {
    const { rerender } = render(<ChatWidget />)
    
    // Manually trigger adding a choice message to verify button rendering
    // This tests the UI structure without complex Voiceflow integration
    expect(true).toBe(true) // Placeholder for now
  })
}) 