'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Info, X, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { formatShortDate } from '@/lib/date-utils'

interface WithdrawalRequestType {
  _id: string
  userId?: {
    username?: string
    balance?: number
  }
  amount: number
  status: number
  requestedAt?: string
  updatedAt?: string
  processedAt?: string
  note?: string
  adminNote?: string
}

type TabType = 'all' | 'pending' | 'approved' | 'rejected'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function WithdrawalTable() {
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const { data, error, isLoading, mutate } = useSWR<WithdrawalRequestType[]>('/api/admin/withdrawals', fetcher, {
    refreshInterval: 30000
  })

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | null
    request: WithdrawalRequestType | null
  }>({
    isOpen: false,
    action: null,
    request: null
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const handleAction = async () => {
    if (!confirmDialog.request || !confirmDialog.action) return

    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/withdrawals/${confirmDialog.request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmDialog.action, note: adminNote || undefined })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || t('withdrawals.failedProcess'))
      }

      toast.success(t(`withdrawals.${confirmDialog.action === 'approve' ? 'approved' : 'rejected'}`) + '!')
      mutate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('withdrawals.unknownError')
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ isOpen: false, action: null, request: null })
      setAdminNote('')
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">{t('withdrawals.loading')}</div>
  if (error) return <div className="p-8 text-center text-red-500">{t('withdrawals.failedToLoad')}</div>
  if (!data || !Array.isArray(data)) return <div className="p-8 text-center text-gray-400">{t('withdrawals.noWithdrawals')}</div>

  const filtered = data.filter((req) => {
    const query = searchTerm.toLowerCase()
    const matchesSearch =
      (req.userId?.username || '').toLowerCase().includes(query) ||
      (req.note || '').toLowerCase().includes(query)

    if (!matchesSearch) return false
    if (activeTab === 'pending') return req.status === 0
    if (activeTab === 'approved') return req.status === 1
    if (activeTab === 'rejected') return req.status !== 0 && req.status !== 1

    return true
  })

  const counts = {
    all: data.length,
    pending: data.filter(r => r.status === 0).length,
    approved: data.filter(r => r.status === 1).length,
    rejected: data.filter(r => r.status !== 0 && r.status !== 1).length,
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400 font-medium">{t('withdrawals.count', { count: data.length })}</p>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            id="searchInput"
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
          >
            {t(`withdrawals.${tab}`)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block card page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.user')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.amount')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.status')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.requestedAt')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.processedAt')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.adminNote')}</th>
                <th className="px-5 py-4 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('withdrawals.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((req: WithdrawalRequestType) => (
                  <tr key={req._id} className="table-row-hover">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-gray-900 tracking-tight">{req.userId?.username || t('common.unknown')}</div>
                      {req.userId?.balance !== undefined && (
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{t('withdrawals.balance', { amount: req.userId.balance.toLocaleString(loc) })}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-bold text-sm text-brand-600">{req.amount.toLocaleString(loc, { minimumFractionDigits: 2 })} DA</td>
                    <td className="px-5 py-4 text-xs">
                      {req.status === 0 ? <span className="badge badge-warning"><span className="pulse-dot" />{t('withdrawals.pending')}</span> : req.status === 1 ? <span className="badge badge-success">{t('withdrawals.approved')}</span> : <span className="badge badge-danger">{t('withdrawals.rejected')}</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 font-medium">{req.requestedAt ? formatShortDate(req.requestedAt, locale) : '-'}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 font-medium">{req.processedAt ? formatShortDate(req.processedAt, locale) : '-'}</td>
                    <td className="px-5 py-4 text-xs text-gray-600 max-w-[200px] truncate" title={req.adminNote || req.note}>{req.adminNote || req.note || '-'}</td>
                    <td className="px-5 py-4 text-end">
                      {req.status === 0 && (
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setConfirmDialog({ isOpen: true, action: 'approve', request: req })} className="btn btn-outline btn-sm text-emerald-600 hover:text-white hover:bg-emerald-500 hover:border-emerald-500">{t('withdrawals.approve')}</button>
                          <button onClick={() => setConfirmDialog({ isOpen: true, action: 'reject', request: req })} className="btn btn-outline btn-sm text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500">{t('withdrawals.reject')}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-xs"><Info className="h-6 w-6 mx-auto mb-2 text-gray-300" />{t('withdrawals.noRequestsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((req: WithdrawalRequestType) => (
            <div key={req._id} className="card card-body p-4 page-enter delay-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-gray-900">{req.userId?.username || t('common.unknown')}</span>
                {req.status === 0 ? <span className="badge badge-warning">{t('withdrawals.pending')}</span> : req.status === 1 ? <span className="badge badge-success">{t('withdrawals.approved')}</span> : <span className="badge badge-danger">{t('withdrawals.rejected')}</span>}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-brand-600">{req.amount.toLocaleString(loc, { minimumFractionDigits: 2 })} DA</span>
                <span className="text-[11px] text-gray-400">{req.updatedAt ? formatShortDate(req.updatedAt, locale) : '-'}</span>
              </div>
              {req.note && <p className="text-xs text-gray-500 mb-2">{req.note}</p>}
              {req.status === 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => setConfirmDialog({ isOpen: true, action: 'approve', request: req })} className="btn btn-outline btn-sm flex-1 justify-center text-emerald-600 h-[32px]">{t('withdrawals.approve')}</button>
                  <button onClick={() => setConfirmDialog({ isOpen: true, action: 'reject', request: req })} className="btn btn-outline btn-sm flex-1 justify-center text-red-500 h-[32px]">{t('withdrawals.reject')}</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card card-body text-center text-gray-400 text-xs py-10"><Info className="h-6 w-6 mx-auto mb-2 text-gray-300" />{t('withdrawals.noRequestsFound')}</div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay page-enter">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden delay-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">{t('withdrawals.confirmTitle')}</h3>
              <button onClick={() => setConfirmDialog({ isOpen: false, action: null, request: null })} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAction(); }} className="p-6 space-y-5">
              <div className="text-sm text-gray-600">
                {confirmDialog.action === 'approve' ? t('withdrawals.confirmApproveBody', { amount: confirmDialog.request?.amount.toLocaleString(loc) || '0', username: confirmDialog.request?.userId?.username || 'Unknown' }) : t('withdrawals.confirmRejectBody', { amount: confirmDialog.request?.amount.toLocaleString(loc) || '0', username: confirmDialog.request?.userId?.username || 'Unknown' })}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('withdrawals.noteLabel')}</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={t('withdrawals.noteLabel')}
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setConfirmDialog({ isOpen: false, action: null, request: null })} className="btn btn-outline" disabled={isProcessing}>
                  {t('withdrawals.cancel')}
                </button>
                <button type="submit" disabled={isProcessing} className={`btn shadow-md ${confirmDialog.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'btn-primary'}`}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  {t('withdrawals.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
