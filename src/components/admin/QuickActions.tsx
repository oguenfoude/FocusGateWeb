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
      <Link href="/admin/modems" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:border-emerald-300 transition-colors group">
        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
          <Signal className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('dashboard.viewModems')}</p>
          <p className="text-xs text-gray-400">{modemsTotal} {t('dashboard.devicesConnected')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-emerald-400 transition-colors" />
      </Link>
      <Link href="/admin/users" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:border-purple-300 transition-colors group">
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
          <UserPlus className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('dashboard.manageUsers')}</p>
          <p className="text-xs text-gray-400">{userCount} {t('dashboard.activeUsers')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-purple-400 transition-colors" />
      </Link>
      <Link href="/admin/withdrawals" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:border-amber-300 transition-colors group">
        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
          <Banknote className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('dashboard.withdrawals')}</p>
          <p className="text-xs text-gray-400">{pendingWithdrawals} {t('dashboard.pendingWithdrawals')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-amber-400 transition-colors" />
      </Link>
    </div>
  )
}
