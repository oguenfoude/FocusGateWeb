import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { TopBar } from '@/components/shared/TopBar'
import { MobileMenuProvider } from '@/components/shared/mobile-menu-provider'
import { LayoutContent } from '@/components/shared/LayoutContent'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <MobileMenuProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <LayoutContent>
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 page-enter">
            {children}
          </main>
        </LayoutContent>
      </div>
    </MobileMenuProvider>
  )
}
