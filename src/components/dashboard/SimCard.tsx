'use client'

import { useLanguage } from '@/components/language-provider'
import { Info } from 'lucide-react'
import { formatTimeAgo } from '@/lib/date-utils'

interface SimCardProps {
  phoneNumber: number | null
  isOnline: boolean
  lastSeen: string | null
}

export function SimCardItem({ phoneNumber, isOnline, lastSeen }: SimCardProps) {
  const { t, locale } = useLanguage()

  return (
    <div className="card card-body flex flex-col justify-between h-full relative overflow-hidden group page-enter">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 drop-shadow-sm">
            {phoneNumber || t('simCard.noSim')}
          </h3>
          <div className="flex items-center gap-1.5 mt-2 bg-gradient-to-r from-brand-50 to-transparent border-l-2 border-brand-500 rounded-r-lg p-2 text-xs text-gray-600 shadow-sm">
            <Info className="h-4 w-4 text-brand-600 flex-shrink-0" />
            <span className="font-medium">{t('dashboard.rechargeInstruction')}</span>
          </div>

        </div>
        <div className="flex flex-col items-end gap-2 relative z-10">
          {isOnline ? (
            <span className="badge badge-success shadow-sm">
              <span className="pulse-dot" />
              {t('simCard.online')}
            </span>
          ) : (
            <span className="badge badge-gray shadow-sm">
              <span className="pulse-dot offline" />
              {t('simCard.offline')}
            </span>
          )}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200/50 text-xs text-gray-400 flex justify-between uppercase tracking-widest font-bold mt-auto relative z-10">
        <span>{t('simCard.lastSeen')}</span>
        <span>{lastSeen ? formatTimeAgo(new Date(lastSeen), locale) : t('simCard.never')}</span>
      </div>
    </div>
  )
}

