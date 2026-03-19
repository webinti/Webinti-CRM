import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { NavigationProgressBar } from '@/components/progress-bar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Webinti CRM',
  description: 'Outil de gestion clients, devis et facturation — Webinti',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <NavigationProgressBar />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#13131e',
              border: '1px solid #252538',
              color: '#f0f0ff',
            },
          }}
        />
      </body>
    </html>
  )
}
