'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { formatTimeAgo } from '@/lib/date-utils'

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
  const { t, locale } = useLanguage()
  const [days, setDays] = useState(7)
  const [modemId, setModemId] = useState('all')

  const { data: modems } = useSWR<ModemRowType[]>('/api/admin/modems', fetcher)
  const { data, error, isLoading } = useSWR<SmsRowType[]>(`/api/admin/sms?days=${days}&modemId=${modemId}`, fetcher, {
    refreshInterval: 30000,
  })

  const modemMap = new Map((modems || []).map(m => [m._id, m.phoneNumber || m.imei || m._id]))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 card card-body">
        <div className="flex-1 w-full flex items-center gap-2">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('sms.modem')}</label>
          <select
            className="input flex-1"
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
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{t('sms.timeframe')}</label>
          <select
            className="input flex-1 sm:w-[150px]"
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
      <div className="hidden lg:block card page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sender')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sim')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.content')}</th>
                <th className="px-6 py-4 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                <tr key={sms._id} className="table-row-hover">
                  <td className="px-6 py-4 font-bold text-sm text-gray-900 tracking-tight">{sms.sender}</td>
                  <td className="px-6 py-4">
                    <span className="badge badge-gray font-mono text-[10px]">{modemMap.get(sms.modemId || '') || sms.modemId || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-[500px] truncate" title={sms.content}>{sms.content}</td>
                  <td className="px-6 py-4 text-end text-xs text-gray-400 whitespace-nowrap font-medium">{sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading && (
          <div className="card card-body text-center text-gray-400 animate-pulse text-xs py-10">{t('common.loading')}</div>
        )}
        {error && (
          <div className="card card-body text-center text-red-500 text-xs py-10">{t('common.error')}</div>
        )}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((sms) => (
          <div key={sms._id} className="card card-body p-4 page-enter delay-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-gray-900">{sms.sender}</span>
              <span className="text-[11px] text-gray-400">{sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}</span>
            </div>
            <div className="text-[11px] text-gray-400 mb-2">{modemMap.get(sms.modemId || '') || ''}</div>
            {sms.content && (
              <p className="text-xs text-gray-500 line-clamp-2">{sms.content}</p>
            )}
          </div>
        ))}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="card card-body text-center py-10">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">{t('sms.noMessages')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
