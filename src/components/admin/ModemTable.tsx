'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Copy, Inbox } from 'lucide-react'
import { getModemBrand } from '@/lib/modem-utils'
import { useLanguage } from '@/components/language-provider'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ModemData {
  _id: string
  imei: string
  model: string | null
  comPort: string | null
  phoneNumber: string | null
  isOnline: boolean
  status: number
  updatedAt: string | null
  balance: number | null
  assignedTo: string | null
  brand: number | null
}

type TabType = 'all' | 'online' | 'offline' | 'assigned' | 'free'

export function ModemTable() {
  const router = useRouter()
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const { data, error, isLoading } = useSWR<ModemData[]>('/api/admin/modems', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>
  if (error) return <div className="p-8 text-center text-red-500">{t('common.error')}</div>
  if (!data || !Array.isArray(data)) return <div className="p-8 text-center text-gray-400">{t('modems.noModemsFound')}</div>

  const counts = {
    all: data.length,
    online: data.filter(m => m.isOnline).length,
    offline: data.filter(m => !m.isOnline).length,
    assigned: data.filter(m => !!m.assignedTo).length,
    free: data.filter(m => !m.assignedTo).length,
  }

  const filtered = data.filter((m) => {
    const query = searchTerm.toLowerCase()
    const matchesSearch =
      (m.imei || '').toLowerCase().includes(query) ||
      (String(m.phoneNumber || '')).toLowerCase().includes(query) ||
      (m.model || '').toLowerCase().includes(query) ||
      (m.assignedTo || '').toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (activeTab === 'online') return m.isOnline
    if (activeTab === 'offline') return !m.isOnline
    if (activeTab === 'assigned') return !!m.assignedTo
    if (activeTab === 'free') return !m.assignedTo

    return true
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('modems.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'online', 'offline', 'assigned', 'free'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab === 'assigned' || tab === 'free' ? <User className="h-3 w-3" /> : null}
            {t(`modems.${tab}`)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.status')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.phoneNumber')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.balance')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.device')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.assignedTo')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('modems.lastSeen')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? (
                filtered.map((modem) => (
                  <tr
                    key={modem._id}
                    onClick={() => router.push(`/admin/modems/${modem._id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      {modem.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t('modems.online')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          {t('modems.offline')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Copy className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-gray-900">{modem.phoneNumber || t('modems.noSim')}</span>
                          <div className="text-[10px] text-gray-400 mt-0.5">{(modem.imei || '').slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-sm text-emerald-600">
                      {modem.balance != null ? `${Number(modem.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} DA` : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-700 text-xs">
                      <span className="font-medium">{getModemBrand(modem.brand)}</span>{' '}
                      <span className="text-gray-400">{modem.model || t('modems.unknown')}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      {modem.assignedTo ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-medium">
                          <User className="h-3 w-3" />
                          {modem.assignedTo}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">{t('modems.free')}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">
                      {modem.updatedAt ? formatDistanceToNow(new Date(modem.updatedAt), { addSuffix: true }) : t('modems.never')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{t('modems.noModems')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((modem) => (
            <div
              key={modem._id}
              onClick={() => router.push(`/admin/modems/${modem._id}`)}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {modem.isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t('modems.online')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {t('modems.offline')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {modem.updatedAt ? formatDistanceToNow(new Date(modem.updatedAt), { addSuffix: true }) : t('modems.never')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-900">{modem.phoneNumber || t('modems.noSim')}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{getModemBrand(modem.brand)} {modem.model || t('modems.unknown')}</p>
                </div>
                <p className="font-bold text-sm text-emerald-600">
                  {modem.balance != null ? `${Number(modem.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} DA` : '-'}
                </p>
              </div>
              {modem.assignedTo && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-medium">
                    <User className="h-3 w-3" />
                    {modem.assignedTo}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('modems.noModemsFound')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
