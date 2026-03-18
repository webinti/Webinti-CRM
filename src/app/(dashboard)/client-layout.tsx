'use client'

import { MobileNavProvider } from '@/components/layout/mobile-nav-context'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <MobileNavProvider>{children}</MobileNavProvider>
}
