'use client'

import { useLanguage } from '@/components/language-provider'
import Link from 'next/link'
import { Signal, UserPlus, Banknote, ChevronRight } from 'lucide-react'

interface QuickActionsProps {
  modemsTotal: number
  userCount: number
  pendingWithdrawals: number
}

export function QuickActions({ modemsTotal, userCount, pendingWithdrawals }: QuickActionsProps) {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Link href="/admin/modems" className="card card-body p-4 flex items-center gap-4 hover:border-emerald-300 group page-enter delay-100">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center group-hover:from-emerald-200 group-hover:to-emerald-100 transition-colors shadow-inner border border-emerald-100/50">
          <Signal className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">{t('dashboard.viewModems')}</p>
          <p className="text-xs text-gray-400 font-medium">{modemsTotal} {t('dashboard.devicesConnected')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
      </Link>
      <Link href="/admin/users" className="card card-body p-4 flex items-center gap-4 hover:border-purple-300 group page-enter delay-200">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 transition-colors shadow-inner border border-purple-100/50">
          <UserPlus className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">{t('dashboard.manageUsers')}</p>
          <p className="text-xs text-gray-400 font-medium">{userCount} {t('dashboard.activeUsers')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
      </Link>
      <Link href="/admin/withdrawals" className="card card-body p-4 flex items-center gap-4 hover:border-amber-300 group page-enter delay-300">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-100 transition-colors shadow-inner border border-amber-100/50">
          <Banknote className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 tracking-tight">{t('dashboard.withdrawals')}</p>
          <p className="text-xs text-gray-400 font-medium">{pendingWithdrawals} {t('dashboard.pendingWithdrawals')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  )
}
