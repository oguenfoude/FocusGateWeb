'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Search, Info } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface WithdrawalRequestType {
  _id: string
  userId?: {
    username?: string
    balance?: number
  }
  amount: number
  status: number
  updatedAt?: string
  note?: string
}

type TabType = 'all' | 'pending' | 'approved' | 'rejected'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function WithdrawalTable() {
  const { t } = useLanguage()
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

  const handleAction = async () => {
    if (!confirmDialog.request || !confirmDialog.action) return

    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/withdrawals/${confirmDialog.request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmDialog.action })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to process request')
      }

      toast.success(t(`withdrawals.${confirmDialog.action === 'approve' ? 'approved' : 'rejected'}`) + '!')
      mutate()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ isOpen: false, action: null, request: null })
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.user')}</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.amount')}</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.status')}</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.requestedAt')}</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.note')}</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('withdrawals.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? (
                filtered.map((req: WithdrawalRequestType) => (
                  <tr key={req._id} className="table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-xs text-gray-900">{req.userId?.username || 'Unknown'}</div>
                      {req.userId?.balance !== undefined && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{t('withdrawals.balance', { amount: req.userId.balance.toLocaleString() })}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-xs text-brand-600">{req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA</td>
                    <td className="px-5 py-3.5 text-xs">
                      {req.status === 0 ? <span className="badge badge-warning">{t('withdrawals.pending')}</span> : req.status === 1 ? <span className="badge badge-success">{t('withdrawals.approved')}</span> : <span className="badge badge-danger">{t('withdrawals.rejected')}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{req.updatedAt ? format(new Date(req.updatedAt), 'dd MMM yyyy, HH:mm') : '-'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[200px] truncate" title={req.note}>{req.note || '-'}</td>
                    <td className="px-5 py-3.5 text-right">
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
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-xs"><Info className="h-6 w-6 mx-auto mb-2 text-gray-300" />{t('withdrawals.noRequestsFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((req: WithdrawalRequestType) => (
            <div key={req._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-gray-900">{req.userId?.username || 'Unknown'}</span>
                {req.status === 0 ? <span className="badge badge-warning">{t('withdrawals.pending')}</span> : req.status === 1 ? <span className="badge badge-success">{t('withdrawals.approved')}</span> : <span className="badge badge-danger">{t('withdrawals.rejected')}</span>}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-brand-600">{req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA</span>
                <span className="text-[11px] text-gray-400">{req.updatedAt ? format(new Date(req.updatedAt), 'dd MMM, HH:mm') : '-'}</span>
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-xs"><Info className="h-6 w-6 mx-auto mb-2 text-gray-300" />{t('withdrawals.noRequestsFound')}</div>
        )}
      </div>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: null, request: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('withdrawals.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' ? t('withdrawals.confirmApproveBody', { amount: confirmDialog.request?.amount.toLocaleString() || '0', username: confirmDialog.request?.userId?.username || 'Unknown' }) : t('withdrawals.confirmRejectBody', { amount: confirmDialog.request?.amount.toLocaleString() || '0', username: confirmDialog.request?.userId?.username || 'Unknown' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('withdrawals.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleAction() }}
              disabled={isProcessing}
              className={confirmDialog.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? t('withdrawals.processing') : t('withdrawals.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
