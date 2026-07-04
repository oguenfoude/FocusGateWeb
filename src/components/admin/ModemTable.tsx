'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Copy, Inbox } from 'lucide-react'
import { getModemBrand } from '@/lib/modem-utils'
import { useLanguage } from '@/components/language-provider'
import { formatTimeAgo } from '@/lib/date-utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ModemData {
  _id: string
  imei: string
  model: string | null
  phoneNumber: number | null
  isOnline: boolean
  status: number
  updatedAt: string | null
  simLastSeen: string | null
  balance: number | null
  assignedTo: string | null
  brand: number | null
}

type TabType = 'all' | 'online' | 'offline' | 'assigned' | 'free'

export function ModemTable() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const { data, error, isLoading } = useSWR<ModemData[]>('/api/admin/modems', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>
  if (error) return <div className="p-8 text-center text-red-500">{t('common.error')}</div>
  if (!data || !Array.isArray(data)) return <div className="p-8 text-center text-gray-400">{t('modems.noModemsFound')}</div>

  const lastSeenOf = (modem: ModemData): string | null => modem.simLastSeen ?? modem.updatedAt
  const formatLastSeen = (modem: ModemData) => {
    const ts = lastSeenOf(modem);
    return ts ? formatTimeAgo(new Date(ts), locale) : t('modems.never');
  };

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
          className="input pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'online', 'offline', 'assigned', 'free'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'assigned' || tab === 'free' ? <User className="h-3 w-3" /> : null}
            {t(`modems.${tab}`)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block card overflow-hidden page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.status')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.phoneNumber')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.balance')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.device')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.assignedTo')}</th>
                <th className="px-6 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('modems.lastSeen')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((modem) => (
                  <tr
                    key={modem._id}
                    onClick={() => router.push(`/admin/modems/${modem._id}`)}
                    className="table-row-hover cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {modem.isOnline ? (
                        <span className="badge badge-success">
                          <span className="pulse-dot" />
                          {t('modems.online')}
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <span className="pulse-dot offline" />
                          {t('modems.offline')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Copy className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-sm text-gray-900 tracking-tight">{modem.phoneNumber || t('modems.noSim')}</span>
                          <div className="font-mono text-[10px] text-gray-400 mt-0.5">{(modem.imei || '').slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">
                      {modem.balance != null ? (
                        <span className={modem.isOnline ? 'text-emerald-600' : 'text-gray-400'}>
                          {Number(modem.balance).toLocaleString(loc, { minimumFractionDigits: 2 })} DA
                          {!modem.isOnline && <span className="text-[10px] font-normal ml-1">({t('modems.lastKnown')})</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-xs">
                      <span className="font-semibold text-gray-900">{getModemBrand(modem.brand)}</span>{' '}
                      <span className="text-gray-500">{modem.model || t('modems.unknown')}</span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {modem.assignedTo ? (
                        <span className="badge badge-purple">
                          <User className="h-3 w-3" />
                          {modem.assignedTo}
                        </span>
                      ) : (
                        <span className="badge badge-gray">{t('modems.free')}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">
                      {formatLastSeen(modem)}
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
              className="card card-body table-row-hover cursor-pointer page-enter delay-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {modem.isOnline ? (
                    <span className="badge badge-success">
                      <span className="pulse-dot" />
                      {t('modems.online')}
                    </span>
                  ) : (
                    <span className="badge badge-gray">
                      <span className="pulse-dot offline" />
                      {t('modems.offline')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatLastSeen(modem)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-900">{modem.phoneNumber || t('modems.noSim')}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{getModemBrand(modem.brand)} {modem.model || t('modems.unknown')}</p>
                </div>
                <p className={`font-bold text-sm ${modem.isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {modem.balance != null ? (
                    <>
                      {Number(modem.balance).toLocaleString(loc, { minimumFractionDigits: 2 })} DA
                      {!modem.isOnline && <span className="text-[10px] font-normal ml-1">({t('modems.lastKnown')})</span>}
                    </>
                  ) : '-'}
                </p>
              </div>
              {modem.assignedTo && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="badge badge-purple">
                    <User className="h-3 w-3" />
                    {modem.assignedTo}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card card-body text-center">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">{t('modems.noModemsFound')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
