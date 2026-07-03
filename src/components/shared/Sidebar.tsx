'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { useMobileMenu } from '@/components/shared/mobile-menu-provider'
import { Locale } from '@/lib/i18n'
import {
  LayoutDashboard,
  Router,
  Users,
  MessageSquare,
  Banknote,
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

export function Sidebar() {
  const pathname = usePathname()
  const { locale, setLocale, t, isRTL } = useLanguage()
  const { isOpen, close } = useMobileMenu()
  const rtl = isRTL

  const links = [
    { href: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/admin/modems', label: t('nav.modems'), icon: Router },
    { href: '/admin/users', label: t('nav.users'), icon: Users },
    { href: '/admin/sms', label: t('nav.sms'), icon: MessageSquare },
    { href: '/admin/withdrawals', label: t('nav.withdrawals'), icon: Banknote },
    { href: '/admin/warnings', label: t('nav.warnings'), icon: AlertTriangle },
  ]

  const sidebarContent = (
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
