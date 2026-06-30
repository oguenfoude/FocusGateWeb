'use client'

import useSWR, { mutate } from 'swr'
import { formatDistanceToNow, format } from 'date-fns'
import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Smartphone, X, Plus, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

interface UserBalanceHistoryItem {
  _id: string
  type: number
  amount: number
  note?: string
  updatedAt?: string
}

interface BalanceHistoryItem {
  _id: string
  simCardId?: string
  delta: number
  source: number
  balance: number
  updatedAt?: string
}

interface SmsRecordItem {
  _id: string
  sender: string
  isOffer?: boolean
  type?: string
  typeLabel?: string
  content?: string
  receivedAt?: string
}

interface AssignmentItem {
  modem: {
    _id: string
    imei: string
    model: string | null
    comPort: string | null
  }
  sim: {
    phoneNumber?: string
    balance?: number
    isActive?: boolean
  } | null
}

interface ModemItem {
  _id: string
  imei: string
  model: string | null
  comPort: string | null
  phoneNumber?: string | null
  assignedTo?: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function sourceLabel(source: number): string {
  switch (source) {
    case 0: return 'USSD Check'
    case 1: return 'SMS Credit'
    case 2: return 'Settlement'
    case 4: return 'Withdrawal'
    default: return 'Other'
  }
}

export function UserDetail({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const [selectedModemId, setSelectedModemId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR(`/api/admin/users/${userId}`, fetcher)
  const { data: allModems } = useSWR<ModemItem[]>('/api/admin/modems', fetcher)
  const freeModems = allModems?.filter((m) => !m.assignedTo) || []

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>
  if (error || data?.error) return <div className="p-8 text-center text-red-500">{t('common.error')}</div>
  if (!data || !data.user) return null

  const { user, assignments = [], balanceHistories = [], userBalanceHistories = [], smsRecords = [] } = data

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModemId) {
      toast.error('Please select a modem to assign')
      return
    }
    try {
      setIsAssigning(true)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', modemId: selectedModemId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to assign modem')
      }
      toast.success('Modem assigned successfully!')
      setSelectedModemId('')
      mutate(`/api/admin/users/${userId}`)
      mutate('/api/admin/modems')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassign = async (modemId: string, infoStr: string) => {
    if (!confirm(`Are you sure you want to unassign modem "${infoStr}"?`)) return
    try {
      setUnassigningId(modemId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', modemId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to unassign modem')
      }
      toast.success('Modem unassigned successfully!')
      mutate(`/api/admin/users/${userId}`)
      mutate('/api/admin/modems')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setUnassigningId(null)
    }
  }

  const avatarLetter = user.displayName ? user.displayName[0].toUpperCase() : user.username?.[0]?.toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold uppercase">
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">{user.displayName || user.username}</h3>
                {user.role === 0 ? <span className="badge badge-purple">{t('users.detail.admin')}</span> : <span className="badge badge-gray">{t('users.detail.user')}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1">@{user.username} &middot; Created {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">{t('users.detail.walletBalance')}</p>
            <p className="text-2xl font-bold text-brand-600 mt-1">{(user.balance || 0).toLocaleString()} DA</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="modems" className="w-full">
        <TabsList className="mb-4 overflow-x-auto w-full justify-start">
          <TabsTrigger value="modems" className="whitespace-nowrap">{t('users.detail.modemsTab')} ({assignments.length})</TabsTrigger>
          <TabsTrigger value="wallet" className="whitespace-nowrap">{t('users.detail.walletHistory')}</TabsTrigger>
          <TabsTrigger value="history" className="whitespace-nowrap">{t('users.detail.balanceHistorySims')}</TabsTrigger>
          <TabsTrigger value="sms" className="whitespace-nowrap">{t('users.detail.smsRecords')}</TabsTrigger>
        </TabsList>

        <TabsContent value="modems" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <div className="card-header"><h4 className="text-sm font-semibold text-gray-900">{t('users.detail.assignedModems')}</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-50">
                    {assignments.length > 0 ? (
                      assignments.map((item: AssignmentItem) => {
                        const phoneStr = item.sim?.phoneNumber || 'No SIM'
                        const detailStr = `${item.modem.model || 'Unknown'} (${phoneStr})`
                        return (
                          <tr key={item.modem._id} className="table-row-hover">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500">
                                  <Smartphone className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-gray-900">{phoneStr}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">IMEI: {item.modem.imei} &middot; {item.modem.comPort || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">{item.sim?.balance !== undefined ? <span className="font-semibold text-xs text-gray-900">{item.sim.balance.toLocaleString()} DA</span> : '-'}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleUnassign(item.modem._id, detailStr)} disabled={unassigningId === item.modem._id} className="text-red-400 hover:text-red-600 transition-colors">
                                {unassigningId === item.modem._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr><td className="px-5 py-8 text-center text-gray-400 text-xs">{t('users.detail.noModemsAssigned')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card self-start">
              <div className="card-header"><h4 className="text-sm font-semibold text-gray-900">{t('users.detail.assignNewModem')}</h4></div>
              <form onSubmit={handleAssign} className="card-body space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.selectAvailable')}</label>
                  <select value={selectedModemId} onChange={(e) => setSelectedModemId(e.target.value)} className="input" disabled={isAssigning}>
                    <option value="">{t('users.detail.chooseModem')}</option>
                    {freeModems.map((m) => (
                      <option key={m._id} value={m._id}>{m.phoneNumber || 'No SIM'} - {m.model || 'Unknown'} (IMEI: {m.imei?.slice(-6) || '?'})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={isAssigning || !selectedModemId} className="btn btn-primary btn-sm w-full justify-center h-[36px]">
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> {t('users.detail.assignModem')}</>}
                </button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <div className="card">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-10"></th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.amount')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.note')}</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {userBalanceHistories.map((h: UserBalanceHistoryItem) => (
                  <tr key={h._id} className="table-row-hover">
                    <td className="px-5 py-3">
                      {h.type === 0 ? <ArrowDownRight className="h-4 w-4 text-emerald-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium">
                      <span className={h.type === 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {h.type === 0 ? '+' : '-'}{Math.abs(h.amount).toLocaleString()} DA
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{h.note || '-'}</td>
                    <td className="px-5 py-3 text-xs text-right text-gray-400">
                      {h.updatedAt ? format(new Date(h.updatedAt), 'dd MMM yyyy, HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
                {userBalanceHistories.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-xs">{t('users.detail.noWalletHistory')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="card">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.simId')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.delta')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.source')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.balance')}</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('users.detail.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {balanceHistories.map((h: BalanceHistoryItem) => (
                  <tr key={h._id} className="table-row-hover">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{h.simCardId || '-'}</td>
                    <td className="px-5 py-3 font-medium text-xs">
                      <span className={(h.delta ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {(h.delta ?? 0) >= 0 ? '+' : ''}{h.delta?.toLocaleString()} DA
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-700">{sourceLabel(h.source)}</td>
                    <td className="px-5 py-3 font-medium text-xs text-gray-900">{h.balance?.toLocaleString()} DA</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">
                      {h.updatedAt ? formatDistanceToNow(new Date(h.updatedAt), { addSuffix: true }) : '-'}
                    </td>
                  </tr>
                ))}
                {balanceHistories.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-400">{t('users.detail.noBalanceHistory')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="card">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sender')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.type')}</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.content')}</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {smsRecords.map((sms: SmsRecordItem) => (
                  <tr key={sms._id} className="table-row-hover">
                    <td className="px-5 py-3 font-medium text-xs text-gray-900">{sms.sender}</td>
                    <td className="px-5 py-3 text-xs">
                      {sms.isOffer ? <span className="badge badge-warning">{sms.typeLabel}</span> : sms.type === 'other' ? <span className="badge badge-gray">{sms.typeLabel}</span> : <span className="badge badge-info">{sms.typeLabel}</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[300px] truncate" title={sms.content}>{sms.content}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">
                      {sms.receivedAt ? formatDistanceToNow(new Date(sms.receivedAt), { addSuffix: true }) : '-'}
                    </td>
                  </tr>
                ))}
                {smsRecords.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">{t('users.detail.noSmsRecords')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
