'use client'

import { useLanguage } from '@/components/language-provider'
import { RadioTower, Wallet, Users, Clock } from 'lucide-react'

interface StatCardsProps {
  modemsTotal: number
  modemsOnline: number
  totalSimBalance: number
  simCount: number
  totalUserBalance: number
  userCount: number
  pendingWithdrawals: number
}

export function StatCards({ modemsTotal, modemsOnline, totalSimBalance, simCount, totalUserBalance, userCount, pendingWithdrawals }: StatCardsProps) {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Modems */}
      <div className="card card-body page-enter relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.modems')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {modemsOnline}<span className="text-lg text-gray-300 font-normal">/{modemsTotal}</span>
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-600 font-medium">{modemsOnline} {t('dashboard.online')}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-emerald-100/50">
            <RadioTower className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* SIM Balance */}
      <div className="card card-body page-enter delay-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.simBalance')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalSimBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-2">{simCount} {t('dashboard.sims')} &middot; DA</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-blue-100/50">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* User Wallets */}
      <div className="card card-body page-enter delay-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.userWallets')}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalUserBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-2">{userCount} {t('dashboard.users')} &middot; DA</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-purple-100/50">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="card card-body page-enter delay-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.pendingRequests')}</p>
            <p className={`text-3xl font-bold mt-2 ${pendingWithdrawals > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
              {pendingWithdrawals}
            </p>
            <p className="text-xs text-gray-400 mt-2">{t('dashboard.withdrawalRequests')}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-amber-100/50">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
