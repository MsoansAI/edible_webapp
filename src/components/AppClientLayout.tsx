'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ElegantChatAssistant from '@/components/ElegantChatAssistant';
import { Toaster } from 'react-hot-toast';

interface AppClientLayoutProps {
  children: React.ReactNode;
}

export default function AppClientLayout({ children }: AppClientLayoutProps) {
  return (
    <body className="min-h-screen bg-white">
      <Header />
      
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      
      <Footer />

      {/* Elegant Chat Assistant - premium floating chat experience */}
      <ElegantChatAssistant />

      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
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