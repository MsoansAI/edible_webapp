'use client';

import { useUIStore } from '@/store/uiStore';
import ChatLauncher from '@/components/ChatLauncher';
import ChatPanel from '@/components/ChatPanel';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';

interface AppClientLayoutProps {
  children: React.ReactNode;
}

export default function AppClientLayout({ children }: AppClientLayoutProps) {
  const { isChatOpen } = useUIStore();

  return (
    <body className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      
      <div
        id="main-content-wrapper"
        className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out \
          ${isChatOpen ? 'md:mr-[50vw] chat-is-open-and-squeezing' : 'mr-0'}
        `}
      >
        <main className="flex-1 flex flex-col w-full">{children}</main>
      </div>

      <ChatPanel />
      <ChatLauncher />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </body>
  );
} 