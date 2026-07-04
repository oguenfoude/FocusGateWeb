'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Smartphone, X, Plus, Loader2, CircleDollarSign, MessageSquare } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { formatDate, formatShortDate, formatTimeAgo } from '@/lib/date-utils'

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
  }
  sim: {
    phoneNumber?: number
    balance?: number
    isActive?: boolean
  } | null
}

interface ModemItem {
  _id: string
  imei: string
  model: string | null
  phoneNumber?: number | null
  assignedTo?: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function sourceLabel(source: number, t: (key: string) => string): string {
  switch (source) {
    case 0: return t('modemDetail.ussdCheck')
    case 1: return t('modemDetail.smsCredit')
    case 2: return t('modemDetail.settlement')
    case 4: return t('modemDetail.withdrawal')
    default: return t('modemDetail.other')
  }
}

export function UserDetail({ userId }: { userId: string }) {
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  const [selectedModemId, setSelectedModemId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [isCrediting, setIsCrediting] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)

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
      toast.error(t('modemDetail.selectModem'))
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
        throw new Error(err.error || t('modemDetail.assignFailed'))
      }
      toast.success(t('modemDetail.assignSuccess'))
      setSelectedModemId('')
      mutate(`/api/admin/users/${userId}`)
      mutate('/api/admin/modems')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('modemDetail.somethingWrong')
      toast.error(message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassign = async (modemId: string) => {
    if (!confirm(t('modemDetail.unassignConfirm'))) return
    try {
      setUnassigningId(modemId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign', modemId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('modemDetail.unassignFailed'))
      }
      toast.success(t('modemDetail.unassignedSuccess'))
      mutate(`/api/admin/users/${userId}`)
      mutate('/api/admin/modems')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('modemDetail.somethingWrong')
      toast.error(message)
    } finally {
      setUnassigningId(null)
    }
  }

  const handleCreditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(creditAmount)
    if (!amt || amt <= 0) {
      toast.error(t('users.detail.invalidAmount'))
      return
    }
    try {
      setIsCrediting(true)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'credit', amount: amt, note: creditNote || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('users.detail.creditFailed'))
      }
      toast.success(t('users.detail.creditSuccess', { amount: amt.toLocaleString(loc) }))
      setIsCreditModalOpen(false)
      setCreditAmount('')
      setCreditNote('')
      mutate(`/api/admin/users/${userId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setIsCrediting(false)
    }
  }

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(withdrawAmount)
    if (!amt || amt <= 0) {
      toast.error(t('users.detail.invalidAmount'))
      return
    }
    const userBalance = Number(user.balance) || 0
    if (amt > userBalance) {
      toast.error(t('withdraw.amountExceeds'))
      return
    }
    try {
      setIsWithdrawing(true)
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), amount: amt, note: withdrawNote || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('withdraw.submitFailed'))
      }
      toast.success(t('withdraw.requestSubmitted'))
      setIsWithdrawModalOpen(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      mutate(`/api/admin/users/${userId}`)
      mutate('/api/admin/withdrawals')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.somethingWentWrong')
      toast.error(message)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const avatarLetter = user.displayName ? user.displayName[0].toUpperCase() : user.username?.[0]?.toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="card card-body p-6 bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 relative overflow-hidden page-enter delay-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 flex items-center justify-center text-2xl font-bold uppercase shadow-sm border border-brand-100/50 flex-shrink-0">
              {avatarLetter}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{user.displayName || user.username}</h3>
                {user.role === 0 ? <span className="badge badge-purple shadow-sm">{t('users.detail.admin')}</span> : <span className="badge badge-gray shadow-sm">{t('users.detail.user')}</span>}
                {user.archivedAt && <span className="badge badge-gray shadow-sm">{t('users.archived')}</span>}
              </div>
              <p className="text-sm text-gray-500 font-medium mt-1">@{user.username} &middot; Created {user.createdAt ? formatDate(user.createdAt, locale) : '-'}</p>
            </div>
          </div>
          <div className="sm:text-end flex flex-col sm:items-end gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">{t('users.detail.walletBalance')}</p>
              <p className="text-3xl font-extrabold text-brand-600 mt-1 tracking-tight">{(user.balance || 0).toLocaleString(loc)} DA</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setIsWithdrawModalOpen(true)} className="btn btn-outline btn-sm">
                <CircleDollarSign className="h-4 w-4" /> {t('withdraw.requestWithdrawal')}
              </button>
              <button onClick={() => setIsCreditModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" /> {t('history.credit')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="modems" className="w-full flex flex-col page-enter delay-200">
        <TabsList className="mb-4 overflow-x-auto w-full justify-start">
          <TabsTrigger value="modems" className="whitespace-nowrap">{t('users.detail.modemsTab')} ({assignments.length})</TabsTrigger>
          <TabsTrigger value="wallet" className="whitespace-nowrap">{t('users.detail.walletHistory')}</TabsTrigger>
          <TabsTrigger value="history" className="whitespace-nowrap">{t('users.detail.balanceHistorySims')}</TabsTrigger>
          <TabsTrigger value="sms" className="whitespace-nowrap">{t('users.detail.smsRecords')}</TabsTrigger>
        </TabsList>

        <TabsContent value="modems" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2 shadow-sm border border-gray-100">
              <div className="card-header bg-gray-50/50 border-b border-gray-100"><h4 className="text-sm font-bold text-gray-900">{t('users.detail.assignedModems')}</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-start hidden lg:table border-collapse">
                  <tbody className="divide-y divide-gray-100">
                    {assignments.length > 0 ? (
                      assignments.map((item: AssignmentItem) => {
                        const phoneStr = item.sim?.phoneNumber || t('common.unknown')
                        return (
                          <tr key={item.modem._id} className="table-row-hover">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shadow-sm">
                                  <Smartphone className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <div className="font-bold text-xs text-gray-900">{phoneStr}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">IMEI: {item.modem.imei}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-end">
                            <button onClick={() => handleUnassign(item.modem._id)} disabled={unassigningId === item.modem._id} className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                {unassigningId === item.modem._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                              <Smartphone className="h-6 w-6" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">{t('users.detail.noModemsAssigned')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="lg:hidden space-y-3 p-4">
                  {assignments.length > 0 ? (
                    assignments.map((item: AssignmentItem) => {
                      const phoneStr = item.sim?.phoneNumber || t('common.unknown')
                      return (
                        <div key={item.modem._id} className="card card-body p-4 table-row-hover shadow-sm border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 shadow-sm border border-brand-100/50">
                                <Smartphone className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-sm text-gray-900">{phoneStr}</div>
                                <div className="text-[11px] text-gray-400 font-mono mt-0.5">IMEI: {item.modem.imei}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                            <button onClick={() => handleUnassign(item.modem._id)} disabled={unassigningId === item.modem._id} className="btn btn-outline text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs py-1.5 h-auto">
                              {unassigningId === item.modem._id ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <X className="h-3 w-3 mr-1.5" />} {t('modems.detail.unassign')}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{t('users.detail.noModemsAssigned')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card self-start shadow-sm border border-gray-100">
              <div className="card-header bg-gray-50/50 border-b border-gray-100"><h4 className="text-sm font-bold text-gray-900">{t('users.detail.assignNewModem')}</h4></div>
              <form onSubmit={handleAssign} className="card-body p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('users.detail.selectAvailable')}</label>
                  <select value={selectedModemId} onChange={(e) => setSelectedModemId(e.target.value)} className="input w-full" disabled={isAssigning}>
                    <option value="">{t('users.detail.chooseModem')}</option>
                    {freeModems.map((m) => (
                      <option key={m._id} value={m._id}>{m.phoneNumber || t('common.unknown')} - {m.model || t('common.unknown')}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={isAssigning || !selectedModemId} className="btn btn-primary w-full justify-center shadow-md">
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" /> {t('users.detail.assignModem')}</>}
                </button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <div className="card shadow-sm border border-gray-100">
            <div className="card-header bg-gray-50/50 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">{t('users.detail.walletHistory')}</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start border-collapse hidden lg:table">
                <thead className="border-b border-gray-100 bg-gray-50/30">
                  <tr>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest w-10"></th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.amount')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.note')}</th>
                    <th className="px-5 py-3 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userBalanceHistories.map((h: UserBalanceHistoryItem) => (
                    <tr key={h._id} className="table-row-hover">
                      <td className="px-5 py-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${h.type === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          {h.type === 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-bold">
                        <span className={h.type === 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {h.type === 0 ? '+' : '-'}{Math.abs(h.amount).toLocaleString(loc)} DA
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 font-medium">{h.note || '-'}</td>
                      <td className="px-5 py-3 text-sm text-end text-gray-400 font-medium">
                        {h.updatedAt ? formatShortDate(h.updatedAt, locale) : '-'}
                      </td>
                    </tr>
                  ))}
                  {userBalanceHistories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
                            <CircleDollarSign className="h-6 w-6" />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">{t('users.detail.noWalletHistory')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="lg:hidden space-y-3 p-4">
                {userBalanceHistories.length > 0 ? (
                  userBalanceHistories.map((h: UserBalanceHistoryItem) => (
                    <div key={h._id} className="card card-body p-4 table-row-hover shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.type === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {h.type === 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <span className={`text-sm font-bold ${h.type === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {h.type === 0 ? '+' : '-'}{Math.abs(h.amount).toLocaleString(loc)} DA
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">{h.updatedAt ? formatShortDate(h.updatedAt, locale) : '-'}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mt-2">{h.note || '-'}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
                      <CircleDollarSign className="h-6 w-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{t('users.detail.noWalletHistory')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="card shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start border-collapse hidden lg:table">
                <thead className="border-b border-gray-100 bg-gray-50/30">
                  <tr>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.simId')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.delta')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.source')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.balance')}</th>
                    <th className="px-5 py-3 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('users.detail.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {balanceHistories.map((h: BalanceHistoryItem) => (
                    <tr key={h._id} className="table-row-hover">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 bg-gray-50/50">{h.simCardId || '-'}</td>
                      <td className="px-5 py-3 font-bold text-sm">
                        <span className={(h.delta ?? 0) >= 0 ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md'}>
                          {(h.delta ?? 0) >= 0 ? '+' : ''}{h.delta?.toLocaleString(loc)} DA
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">{sourceLabel(h.source, t)}</td>
                      <td className="px-5 py-3 font-bold text-sm text-gray-900">{h.balance?.toLocaleString(loc)} DA</td>
                      <td className="px-5 py-3 text-end text-sm font-medium text-gray-400">
                        {h.updatedAt ? formatTimeAgo(new Date(h.updatedAt), locale) : '-'}
                      </td>
                    </tr>
                  ))}
                  {balanceHistories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                            <CircleDollarSign className="h-6 w-6" />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">{t('users.detail.noBalanceHistory')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="lg:hidden space-y-3 p-4">
                {balanceHistories.length > 0 ? (
                  balanceHistories.map((h: BalanceHistoryItem) => (
                    <div key={h._id} className="card card-body p-4 table-row-hover shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-bold px-2 py-1 rounded-md ${(h.delta ?? 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {(h.delta ?? 0) >= 0 ? '+' : ''}{h.delta?.toLocaleString(loc)} DA
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">{h.updatedAt ? formatTimeAgo(new Date(h.updatedAt), locale) : '-'}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">{t('users.detail.source')}</span>
                          <span className="text-gray-900 font-semibold">{sourceLabel(h.source, t)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 font-medium">{t('common.balance')}</span>
                          <span className="text-brand-600 font-bold">{h.balance?.toLocaleString(loc)} DA</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                      <CircleDollarSign className="h-6 w-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{t('users.detail.noBalanceHistory')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="card shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start border-collapse hidden lg:table">
                <thead className="border-b border-gray-100 bg-gray-50/30">
                  <tr>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sender')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.type')}</th>
                    <th className="px-5 py-3 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest w-[40%]">{t('sms.content')}</th>
                    <th className="px-5 py-3 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {smsRecords.map((sms: SmsRecordItem) => (
                    <tr key={sms._id} className="table-row-hover">
                      <td className="px-5 py-3 font-bold text-sm text-gray-900 whitespace-nowrap">{sms.sender}</td>
                      <td className="px-5 py-3 text-sm whitespace-nowrap">
                        {sms.isOffer ? <span className="badge badge-warning shadow-sm">{t(sms.typeLabel || 'sms.types.info')}</span> : sms.type === 'other' ? <span className="badge badge-gray shadow-sm">{t(sms.typeLabel || 'sms.types.info')}</span> : <span className="badge badge-info shadow-sm">{t(sms.typeLabel || 'sms.types.info')}</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 font-medium leading-relaxed max-w-md truncate" title={sms.content}>{sms.content}</td>
                      <td className="px-5 py-3 text-end text-sm font-medium text-gray-400 whitespace-nowrap">
                        {sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}
                      </td>
                    </tr>
                  ))}
                  {smsRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
                            <MessageSquare className="h-6 w-6" />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">{t('users.detail.noSmsRecords')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="lg:hidden space-y-3 p-4">
                {smsRecords.length > 0 ? (
                  smsRecords.map((sms: SmsRecordItem) => (
                    <div key={sms._id} className="card card-body p-4 table-row-hover shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                        <span className="font-bold text-sm text-gray-900">{sms.sender}</span>
                        {sms.isOffer ? <span className="badge badge-warning">{t(sms.typeLabel || 'sms.types.info')}</span> : sms.type === 'other' ? <span className="badge badge-gray">{t(sms.typeLabel || 'sms.types.info')}</span> : <span className="badge badge-info">{t(sms.typeLabel || 'sms.types.info')}</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg leading-relaxed">{sms.content}</p>
                      <div className="text-end">
                        <span className="text-[11px] font-medium text-gray-400">{sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">{t('users.detail.noSmsRecords')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Credit User Modal */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center text-brand-600">
                  <Plus className="w-4 h-4" />
                </div>
                {t('users.credit')}
              </h4>
              <button onClick={() => setIsCreditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreditUser}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{t('users.detail.amount')}</label>
                  <div className="relative">
                    <input type="number" min="1" required value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0" className="input w-full pl-4 pr-12 text-lg font-bold shadow-sm" />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-bold">DA</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{t('users.detail.note')}</label>
                  <input type="text" value={creditNote} onChange={(e) => setCreditNote(e.target.value)} placeholder={t('withdrawals.noteLabel')} className="input w-full shadow-sm" />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsCreditModalOpen(false)} className="btn btn-outline bg-white hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={isCrediting} className="btn btn-primary min-w-[120px] flex justify-center shadow-md">
                  {isCrediting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('users.credit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                {t('withdraw.requestWithdrawal')}
              </h4>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateWithdrawal}>
              <div className="p-6 space-y-5">
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 mb-6">
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">{t('withdraw.availableBalance')}</p>
                  <p className="text-2xl font-extrabold text-amber-700">{(Number(user.balance) || 0).toLocaleString(loc)} DA</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{t('withdraw.amountLabel')}</label>
                  <div className="relative">
                    <input type="number" min="0.01" step="0.01" required value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={t('withdraw.amountPlaceholder')} className="input w-full pl-4 pr-12 text-lg font-bold shadow-sm" />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-bold">DA</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{t('withdraw.noteLabel')}</label>
                  <textarea value={withdrawNote} onChange={(e) => setWithdrawNote(e.target.value)} placeholder={t('withdraw.notePlaceholder')} rows={2} className="input w-full resize-none shadow-sm" />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="btn btn-outline bg-white hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={isWithdrawing} className="btn btn-primary min-w-[140px] flex justify-center shadow-md">
                  {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : t('withdraw.submitRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
