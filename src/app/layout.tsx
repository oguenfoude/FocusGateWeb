import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { LiveProvider } from '@/components/shared/LiveProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlixiDz Dashboard',
  description: 'Manage FlixiDz USB Modem SMS Gateway',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <Providers>
          <LiveProvider>
            {children}
            <Toaster position="top-right" richColors />
          </LiveProvider>
        </Providers>
      </body>
    </html>
  )
}
