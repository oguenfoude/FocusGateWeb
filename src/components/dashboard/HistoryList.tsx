'use client'

import useSWR from 'swr'
import { formatDistanceToNow, format } from 'date-fns'
import { useLanguage } from '@/components/language-provider'

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

export function HistoryList() {
  const { t } = useLanguage()
  const { data, error, isLoading } = useSWR('/api/dashboard/history', fetcher, {
    refreshInterval: 30000,
  })

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.note')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('history.amountCredited')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.walletBalance')}</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('history.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400 animate-pulse">{t('history.loading')}</td></tr>}
              {error && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-red-500">{t('history.failedToLoad')}</td></tr>}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">{t('history.noHistoryEvents')}</td></tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((h: HistoryItemType) => {
                const dateStr = h.recordedAt || h.updatedAt
                const displayDate = dateStr ? new Date(dateStr) : null
                const isCredit = h.type === 0 || h.amount > 0

                return (
                  <tr key={h._id} className="table-row-hover">
                    <td className="px-5 py-3 text-gray-900 text-xs font-medium max-w-[250px] truncate">
                      {h.note || (isCredit ? t('history.credit') : t('history.debit'))}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs`}>
                        {isCredit ? '+' : ''}{h.amount.toLocaleString()} DA
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs font-medium">
                      {h.balanceAfter?.toLocaleString()} DA
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="text-gray-500 font-medium text-xs">{displayDate ? formatDistanceToNow(displayDate, { addSuffix: true }) : '-'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{displayDate ? format(displayDate, 'dd MMM yyyy HH:mm') : ''}</div>
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
        {isLoading && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-gray-400 animate-pulse text-xs">{t('common.loading')}</div>}
        {error && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-red-500 text-xs">{t('common.error')}</div>}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((h: HistoryItemType) => {
          const dateStr = h.recordedAt || h.updatedAt
          const displayDate = dateStr ? new Date(dateStr) : null
          const isCredit = h.type === 0 || h.amount > 0

          return (
            <div key={h._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'} font-bold text-xs`}>
                  {isCredit ? '+' : ''}{h.amount.toLocaleString()} DA
                </span>
                <span className="text-[11px] text-gray-400">{displayDate ? formatDistanceToNow(displayDate, { addSuffix: true }) : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-900 font-medium">{h.note || (isCredit ? 'Credit' : 'Debit')}</span>
                <span className="text-[10px] text-gray-400">{t('users.detail.walletBalance')}: {h.balanceAfter?.toLocaleString()} DA</span>
              </div>
            </div>
          )
        })}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-xs">{t('history.noHistoryFound')}</div>
        )}
      </div>
    </div>
  )
}
