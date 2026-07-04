'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Inbox } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

interface ModemRowType {
  _id: string
  phoneNumber?: number
  imei?: string
}

interface SmsRowType {
  _id: string
  modemId?: string
  sender: string
  content?: string
  receivedAt?: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SmsTable() {
  const { t } = useLanguage()
  const [days, setDays] = useState(7)
  const [modemId, setModemId] = useState('all')

  const { data: modems } = useSWR<ModemRowType[]>('/api/admin/modems', fetcher)
  const { data, error, isLoading } = useSWR<SmsRowType[]>(`/api/admin/sms?days=${days}&modemId=${modemId}`, fetcher, {
    refreshInterval: 30000,
  })

  const modemMap = new Map((modems || []).map(m => [m._id, m.phoneNumber || m.imei || m._id]))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 w-full flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('sms.modem')}</label>
          <select
            className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={modemId}
            onChange={(e) => setModemId(e.target.value)}
          >
            <option value="all">{t('sms.allModems')}</option>
            {modems?.map((m) => (
              <option key={m._id} value={m._id}>{m.phoneNumber || m.imei}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('sms.timeframe')}</label>
          <select
            className="flex-1 sm:w-[150px] h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>{t('sms.last24h')}</option>
            <option value={7}>{t('sms.last7d')}</option>
            <option value={30}>{t('sms.last30d')}</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sender')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sim')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.content')}</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 animate-pulse text-xs">{t('sms.loading')}</td></tr>
              )}
              {error && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-red-500 text-xs">{t('sms.failed')}</td></tr>
              )}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr><td colSpan={4} className="px-6 py-12 text-center"><Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('sms.noRecords')}</p></td></tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((sms) => (
                <tr key={sms._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-xs text-gray-900">{sms.sender}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">{modemMap.get(sms.modemId || '') || sms.modemId || '-'}</td>
                  <td className="px-6 py-3 text-xs text-gray-500 max-w-[500px] truncate" title={sms.content}>{sms.content}</td>
                  <td className="px-6 py-3 text-right text-xs text-gray-400 whitespace-nowrap">{sms.receivedAt ? formatDistanceToNow(new Date(sms.receivedAt), { addSuffix: true }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-gray-400 animate-pulse text-xs">{t('common.loading')}</div>
        )}
        {error && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-red-500 text-xs">{t('common.error')}</div>
        )}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((sms) => (
          <div key={sms._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-gray-900">{sms.sender}</span>
              <span className="text-[11px] text-gray-400">{sms.receivedAt ? formatDistanceToNow(new Date(sms.receivedAt), { addSuffix: true }) : '-'}</span>
            </div>
            <div className="text-[11px] text-gray-400 mb-2">{modemMap.get(sms.modemId || '') || ''}</div>
            {sms.content && (
              <p className="text-xs text-gray-500 line-clamp-2">{sms.content}</p>
            )}
          </div>
        ))}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('sms.noMessages')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
