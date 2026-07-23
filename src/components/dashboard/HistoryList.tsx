'use client'

import useSWR from 'swr'
import { CircleDollarSign, Loader2, Inbox } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { getUserBalanceTypeLabelKey } from '@/lib/balance-utils'
import { formatDate } from '@/lib/date-utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface HistoryItemType {
  _id: string
  amount: number
  balanceAfter: number
  type: number // 0 = Credit, 1 = Debit
  note?: string
  recordedAt?: string
  updatedAt?: string
}

export function HistoryList({ userId }: { userId: string }) {
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  const { data, error, isLoading } = useSWR(
    userId ? `/api/dashboard/history?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block card page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.note')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('history.amountCredited')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.walletBalance')}</th>
                <th className="px-5 py-4 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('history.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                      <p className="text-gray-400 font-medium animate-pulse text-sm">{t('history.loading')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="text-red-500 font-medium text-sm">{t('history.failedToLoad')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
                        <CircleDollarSign className="h-6 w-6" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{t('history.noHistoryEvents')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((h: HistoryItemType) => {
                const dateStr = h.recordedAt || h.updatedAt
                const displayDate = dateStr ? new Date(dateStr) : null
                const typeLabelKey = getUserBalanceTypeLabelKey(h.type)
                const isCredit = h.type === 0
                const displayAmount = Math.abs(h.amount)

                return (
                   <tr key={h._id} className="table-row-hover">
                    <td className="px-5 py-4 text-gray-900 text-xs font-semibold max-w-[250px] truncate">
                      {h.note || t(typeLabelKey)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs shadow-sm`}>
                        {isCredit ? '+' : '-'}{displayAmount.toLocaleString(loc)} {t('common.da')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs font-bold">
                      {h.balanceAfter?.toLocaleString(loc)} {t('common.da')}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <div className="text-gray-500 font-medium text-xs">{displayDate ? formatDate(displayDate, locale) : '-'}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading && (
          <div className="card card-body p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-gray-400 font-medium animate-pulse text-sm">{t('common.loading')}</p>
          </div>
        )}
        {error && (
          <div className="card card-body p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-red-500 font-medium text-sm">{t('common.error')}</p>
          </div>
        )}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((h: HistoryItemType) => {
          const dateStr = h.recordedAt || h.updatedAt
          const displayDate = dateStr ? new Date(dateStr) : null
          const typeLabelKey = getUserBalanceTypeLabelKey(h.type)
          const isCredit = h.type === 0
          const displayAmount = Math.abs(h.amount)

          return (
            <div key={h._id} className="card card-body p-4 page-enter delay-100">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs`}>
                  {isCredit ? '+' : '-'}{displayAmount.toLocaleString(loc)} {t('common.da')}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">{displayDate ? formatDate(displayDate, locale) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-900 font-semibold">{h.note || t(typeLabelKey)}</span>
                <span className="text-[10px] text-gray-500 font-bold">{t('users.detail.walletBalance')}: {h.balanceAfter?.toLocaleString(loc)} {t('common.da')}</span>
              </div>
            </div>
          )
        })}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
              <CircleDollarSign className="h-6 w-6" />
            </div>
            <p className="text-gray-500 text-sm font-medium">{t('history.noHistoryFound')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
