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
  title: 'Edible Arrangements - Premium Gifts & Fresh Fruit Arrangements',
  description: 'Send the perfect gift with Edible Arrangements. Fresh fruit arrangements, chocolate-covered strawberries, and gourmet treats delivered nationwide.',
  keywords: 'fruit arrangements, chocolate strawberries, gifts, edible arrangements, fresh fruit',
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