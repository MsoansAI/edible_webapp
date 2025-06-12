// This remains a Server Component
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import AppClientLayout from '@/components/AppClientLayout'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

// Metadata export is allowed in Server Components
export const metadata: Metadata = {
  title: 'Edible Arrangements - Voice Agent Demo',
  description: 'A real-time demonstration of the AI-powered customer service agent for franchisees.',
  icons: {
    icon: 'https://jfjvqylmjzprnztbfhpa.supabase.co/storage/v1/object/public/assets//faviconnew.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      {/* AppClientLayout now contains the <body> and all client-side logic */}
      <AppClientLayout>{children}</AppClientLayout>
    </html>
  )
} 