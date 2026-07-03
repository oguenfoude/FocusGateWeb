'use client'

import { formatDistanceToNow } from 'date-fns'
import { useLanguage } from '@/components/language-provider'
import { BALANCE_WARN_THRESHOLD } from '@/lib/balance-alert'
import { AlertTriangle, Info } from 'lucide-react'

interface SimCardProps {
  phoneNumber: number | null
  isOnline: boolean
  lastSeen: string | null
  balance?: number
}

export function SimCardItem({ phoneNumber, isOnline, lastSeen, balance = 0 }: SimCardProps) {
  const { t } = useLanguage()
  const isNearWarnLimit = balance >= BALANCE_WARN_THRESHOLD

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between h-full relative overflow-hidden">
      {isNearWarnLimit && (
        <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[11px] font-bold py-1 px-3 flex items-center gap-1.5 justify-center">
          <AlertTriangle className="h-3 w-3" />
          {t('warnings.title')}: {balance.toLocaleString()} / {BALANCE_WARN_THRESHOLD.toLocaleString()} DA
        </div>
      )}
      <div className={`flex justify-between items-start mb-4 ${isNearWarnLimit ? 'mt-5' : ''}`}>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            {phoneNumber || t('simCard.noSim')}
          </h3>
          <div className="flex items-center gap-1.5 mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs text-gray-500">
            <Info className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
            <span>{t('dashboard.rechargeInstruction')}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('simCard.online')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {t('simCard.offline')}
            </span>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between uppercase tracking-wider font-semibold mt-auto">
        <span>{t('simCard.lastSeen')}</span>
        <span>{lastSeen ? formatDistanceToNow(new Date(lastSeen), { addSuffix: true }) : t('simCard.never')}</span>
      </div>
    </div>
  )
}
