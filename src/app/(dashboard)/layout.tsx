import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ClientLayout } from './client-layout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect('/login')
  }

  return (
    <ClientLayout>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d14' }}>
        {/* Spacer for fixed sidebar — desktop only */}
        <div className="hidden lg:block" style={{ width: 240, flexShrink: 0 }} />
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden pb-[72px] lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </ClientLayout>
  )
}
