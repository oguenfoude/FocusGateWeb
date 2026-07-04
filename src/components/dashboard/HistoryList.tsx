'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { useLanguage } from '@/components/language-provider'
import { getUserBalanceTypeLabel } from '@/lib/balance-utils'
import { formatShortDate } from '@/lib/date-utils'

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
              {isLoading && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400 animate-pulse">{t('history.loading')}</td></tr>}
              {error && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-red-500">{t('history.failedToLoad')}</td></tr>}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">{t('history.noHistoryEvents')}</td></tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((h: HistoryItemType) => {
                const dateStr = h.recordedAt || h.updatedAt
                const displayDate = dateStr ? new Date(dateStr) : null
                const typeLabel = getUserBalanceTypeLabel(h.type)
                const isCredit = h.type === 0
                const displayAmount = Math.abs(h.amount)

                return (
                  <tr key={h._id} className="table-row-hover">
                    <td className="px-5 py-4 text-gray-900 text-xs font-semibold max-w-[250px] truncate">
                      {h.note || typeLabel}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs shadow-sm`}>
                        {isCredit ? '+' : '-'}{displayAmount.toLocaleString()} DA
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs font-bold">
                      {h.balanceAfter?.toLocaleString()} DA
                    </td>
                    <td className="px-5 py-4 text-end">
                      <div className="text-gray-500 font-medium text-xs">{displayDate ? formatDistanceToNow(displayDate, { addSuffix: true }) : '-'}</div>
                      <div className="text-[10px] text-gray-400 font-medium mt-1">{displayDate ? formatShortDate(displayDate, locale) : ''}</div>
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
        {isLoading && <div className="card card-body p-6 text-center text-gray-400 animate-pulse text-xs">{t('common.loading')}</div>}
        {error && <div className="card card-body p-6 text-center text-red-500 text-xs">{t('common.error')}</div>}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((h: HistoryItemType) => {
          const dateStr = h.recordedAt || h.updatedAt
          const displayDate = dateStr ? new Date(dateStr) : null
          const typeLabel = getUserBalanceTypeLabel(h.type)
          const isCredit = h.type === 0
          const displayAmount = Math.abs(h.amount)

          return (
            <div key={h._id} className="card card-body p-4 page-enter delay-100">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs`}>
                  {isCredit ? '+' : '-'}{displayAmount.toLocaleString()} DA
                </span>
                <span className="text-[11px] text-gray-400 font-medium">{displayDate ? formatDistanceToNow(displayDate, { addSuffix: true }) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-900 font-semibold">{h.note || typeLabel}</span>
                <span className="text-[10px] text-gray-500 font-bold">{t('users.detail.walletBalance')}: {h.balanceAfter?.toLocaleString()} DA</span>
              </div>
            </div>
          )
        })}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="card card-body p-8 text-center text-gray-400 text-xs">{t('history.noHistoryFound')}</div>
        )}
      </div>
    </div>
  )
}
