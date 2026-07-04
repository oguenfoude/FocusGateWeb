'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { TopBar } from '@/components/shared/TopBar'
import { MobileMenuProvider } from '@/components/shared/mobile-menu-provider'
import { LayoutContent } from '@/components/shared/LayoutContent'
import { useLanguage } from '@/components/language-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-sm text-gray-400">{t('common.loading')}</div>
      </div>
    )
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
