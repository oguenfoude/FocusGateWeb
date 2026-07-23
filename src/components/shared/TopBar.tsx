'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { useMobileMenu } from '@/components/shared/mobile-menu-provider'
import { useUserId } from '@/components/user-id-provider'
import { Menu } from 'lucide-react'

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'nav.dashboard',
  '/admin/modems': 'nav.modems',
  '/admin/users': 'nav.users',
  '/admin/sms': 'nav.sms',
  '/admin/withdrawals': 'nav.withdrawals',
  '/admin/warnings': 'nav.warnings',
  '/dashboard': 'nav.dashboard',
  '/dashboard/sims': 'nav.mySims',
  '/dashboard/sms': 'nav.mySms',
  '/dashboard/history': 'nav.history',
  '/dashboard/withdraw': 'nav.withdraw',
}

export function TopBar() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const { toggle } = useMobileMenu()
  const userId = useUserId()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Algiers',
    }))
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  let titleKey = ROUTE_TITLES[pathname]
  if (!titleKey) {
    const segments = pathname.split('/')
    if (segments.length >= 4) {
      const basePath = `/${segments[1]}/${segments[2]}`
      titleKey = ROUTE_TITLES[basePath]
    }
  }
  const displayTitle = titleKey ? t(titleKey) : t('app.adminTitle')

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3 sticky top-0 z-20 shrink-0 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {displayTitle}
          </h2>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-xs text-gray-400 font-medium tracking-wide hidden sm:block">
            {time || '--:--'}
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold uppercase tracking-wider shadow-[0_2px_8px_rgba(20,184,166,0.3)] ring-2 ring-white">
            {userId ? userId.toString().slice(-1).toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  )
}
