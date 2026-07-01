'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useLanguage } from '@/components/language-provider'
import { useMobileMenu } from '@/components/shared/mobile-menu-provider'
import { Locale } from '@/lib/i18n'
import {
  LayoutDashboard,
  Router,
  Users,
  MessageSquare,
  Banknote,
  LogOut,
  Smartphone,
  History,
  AlertTriangle,
  RadioTower,
  X,
} from 'lucide-react'

const LOCALES: { code: Locale; label: string; flag: string; short: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿', short: 'عر' },
]

function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-5 py-5 border-b border-sidebar-border-color">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-20" />
            <div className="h-2.5 bg-white/10 rounded w-16" />
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 bg-white/5 rounded-lg" />
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-sidebar-border-color">
        <div className="h-2.5 bg-white/10 rounded w-14 mb-2" />
        <div className="flex gap-1.5">
          <div className="flex-1 h-8 bg-white/5 rounded-lg" />
          <div className="flex-1 h-8 bg-white/5 rounded-lg" />
          <div className="flex-1 h-8 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="px-5 py-4 border-t border-sidebar-border-color">
        <div className="h-8 bg-white/5 rounded-lg w-full" />
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { locale, setLocale, t, isRTL } = useLanguage()
  const { isOpen, close } = useMobileMenu()
  const role = session?.user?.role
  const rtl = isRTL
  const isLoading = status === 'loading'

  const adminLinks = [
    { href: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/admin/modems', label: t('nav.modems'), icon: Router },
    { href: '/admin/users', label: t('nav.users'), icon: Users },
    { href: '/admin/sms', label: t('nav.sms'), icon: MessageSquare },
    { href: '/admin/withdrawals', label: t('nav.withdrawals'), icon: Banknote },
    { href: '/admin/warnings', label: t('nav.warnings'), icon: AlertTriangle },
  ]

  const userLinks = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/sims', label: t('nav.mySims'), icon: Smartphone },
    { href: '/dashboard/sms', label: t('nav.mySms'), icon: MessageSquare },
    { href: '/dashboard/history', label: t('nav.history'), icon: History },
    { href: '/dashboard/withdraw', label: t('nav.withdraw'), icon: Banknote },
  ]

  const links = role === 'admin' ? adminLinks : userLinks

  const sidebarContent = isLoading ? <SidebarSkeleton /> : (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border-color">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <RadioTower className="text-white h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold tracking-tight">FocusGate</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('app.name')}</p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={close}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = link.href === '/admin' || link.href === '/dashboard'
            ? pathname === link.href
            : pathname.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {isActive && (
                <div className={`absolute top-1.5 bottom-1.5 w-[3px] rounded-sm bg-brand-500 ${rtl ? 'right-0 rounded-l-sm' : 'left-0 rounded-r-sm'}`} />
              )}
              <Icon className="h-5 w-5" strokeWidth={2.5} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Language Switcher */}
      <div className="px-3 py-3 border-t border-sidebar-border-color">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">{t('settings.language')}</p>
        <div className="flex gap-1.5">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                locale === l.code
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border-color">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 text-[13px] font-medium text-slate-300 hover:text-white transition-colors mb-3"
        >
          <LogOut className="h-4 w-4 text-brand-400" />
          {t('auth.logout')}
        </button>

      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible, position switches for RTL */}
      <aside className={`hidden lg:flex w-64 bg-sidebar-main text-white flex-col min-h-screen fixed z-30 transition-all duration-200 ${rtl ? 'right-0' : 'left-0'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — toggleable, slides from correct side */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          {/* Panel */}
          <aside className={`absolute inset-y-0 w-64 bg-sidebar-main text-white flex flex-col transform transition-transform duration-200 ease-out ${rtl ? 'right-0' : 'left-0'}`}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
