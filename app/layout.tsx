import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ReferralTracker } from '@/components/ReferralTracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FF Tournament — Free Fire Tournament Platform',
  description: 'Join Free Fire tournaments, compete with players, win real prizes. Browse solo, duo, and squad tournaments.',
  keywords: ['free fire', 'tournament', 'gaming', 'esports', 'prize'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FF Tournament',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} bg-[#080812] text-white antialiased`}>
        <ReferralTracker />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              border: '1px solid rgba(249,115,22,0.3)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
