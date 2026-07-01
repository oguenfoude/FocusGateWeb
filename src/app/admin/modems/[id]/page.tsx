'use client'

import useSWR, { mutate } from 'swr'
import { format } from 'date-fns'
import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RadioTower, Info, History, MessageSquare, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface ModemDetailData {
  modem: {
    _id: string
    imei: string
    model: string | null
    comPort: string | null
    brand: string | null
    machineId: string
    createdAt: string
    isOnline: boolean
  }
  sim: {
    _id: string
    imsi: string
    phoneNumber: string
    balance: number
    isActive: boolean
    firstSeen: string
    lastSeen: string
  } | null
  assignedUser: {
    _id: string
    username: string
  } | null
  balanceHistory: Array<{
    _id: string
    balance: number
    previousBalance: number | null
    recordedAt: string
    source: string | number
    delta: number
  }>
  smsRecords: Array<{
    _id: string
    senderNumber: string
    content: string
    receivedAt: string
  }>
  smsCount: number
}

export default function AdminModemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const modemId = resolvedParams.id
  const router = useRouter()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'info' | 'balance' | 'sms'>('info')
  const [isUnassigning, setIsUnassigning] = useState(false)

  const { data, error, isLoading } = useSWR<ModemDetailData>(`/api/admin/modems/${modemId}`, fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('modemDetail.loading')}</div>
  if (error || (data && 'error' in data)) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>{t('modemDetail.loadError')}</p>
        <button onClick={() => router.push('/admin/modems')} className="btn btn-outline btn-sm mt-4">
          {t('modemDetail.backToModems')}
        </button>
      </div>
    )
  }
  if (!data) return null

  const { modem, sim, assignedUser, balanceHistory, smsRecords, smsCount } = data

  const handleUnassign = async () => {
    if (!confirm(t('modemDetail.unassignConfirm'))) return

    try {
      setIsUnassigning(true)
      const res = await fetch(`/api/admin/modems/${modemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || t('modemDetail.unassignFailed'))
      }

      toast.success(t('modemDetail.unassignedSuccess'))
      mutate(`/api/admin/modems/${modemId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('modemDetail.somethingWrong')
      toast.error(message)
    } finally {
      setIsUnassigning(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Back Link */}
      <button
        onClick={() => router.push('/admin/modems')}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t('modemDetail.backToModems')}
      </button>

      {/* Header card */}
      <div className="card">
        <div className="card-body flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              modem.isOnline ? 'bg-brand-50' : 'bg-gray-100'
            }`}>
              <RadioTower className={`h-7 w-7 ${modem.isOnline ? 'text-brand-500' : 'text-gray-400'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {sim ? sim.phoneNumber : modem.imei}
                </h3>
                {modem.isOnline ? (
                  <span className="badge badge-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t('modemDetail.online')}
                  </span>
                ) : (
                  <span className="badge badge-danger">{t('modemDetail.offline')}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {modem.brand} {modem.model} &middot; {modem.comPort || 'N/A'} &middot; {modem.machineId ? modem.machineId.slice(0, 8) : 'N/A'}
              </p>
            </div>
          </div>
          {sim && (
            <div className="md:text-right">
              <p className="text-2xl font-bold text-brand-600">
                {sim.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA
              </p>
              <p className="text-xs font-mono text-gray-400 mt-0.5">IMEI: {modem.imei}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div>
        <div className="flex gap-2 border-b border-gray-200 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px ${
              activeTab === 'info' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Info className="h-4 w-4" /> {t('modemDetail.info')}
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px ${
              activeTab === 'balance' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <History className="h-4 w-4" /> {t('modemDetail.balanceHistory')}
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px ${
              activeTab === 'sms' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> {t('modemDetail.sms')}
            <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {smsCount}
            </span>
          </button>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            {/* Modem Info */}
            <div className="card">
              <div className="card-header">
                <h4 className="text-sm font-semibold text-gray-900">{t('modemDetail.modemInformation')}</h4>
              </div>
              <div className="card-body">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('modemDetail.imei')}</dt>
                    <dd className="font-mono text-sm font-medium mt-1">{modem.imei}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('modemDetail.comPort')}</dt>
                    <dd className="text-sm font-medium mt-1">{modem.comPort || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('modemDetail.brandModel')}</dt>
                    <dd className="text-sm font-medium mt-1">{modem.brand} {modem.model}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('modemDetail.created')}</dt>
                    <dd className="text-sm font-medium mt-1">
                      {modem.createdAt ? format(new Date(modem.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('modemDetail.machineId')}</dt>
                    <dd className="font-mono text-xs mt-1 text-gray-500 truncate" title={modem.machineId}>
                      {modem.machineId}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* SIM Card Info */}
            <div className="card">
              <div className="card-header">
                <h4 className="text-sm font-semibold text-gray-900">{t('modemDetail.simCard')}</h4>
              </div>
              <div className="card-body">
                {sim ? (
                  <div className="space-y-4">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.imsi')}</dt>
                        <dd className="font-mono font-semibold">{sim.imsi}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.phone')}</dt>
                        <dd className="font-semibold">{sim.phoneNumber}</dd>
                      </div>
                      <div className="flex justify-between items-center">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.balance')}</dt>
                        <dd className="text-lg font-bold text-brand-600">
                          {sim.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.status')}</dt>
                        <dd>
                          <span className={`badge ${sim.isActive ? 'badge-success' : 'badge-gray'}`}>
                            {sim.isActive ? t('modemDetail.active') : t('modemDetail.inactive')}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.firstSeen')}</dt>
                        <dd className="text-xs text-gray-600 font-medium">
                          {sim.firstSeen ? format(new Date(sim.firstSeen), 'MMM dd, yyyy') : '-'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-400 font-medium">{t('modemDetail.lastSeen')}</dt>
                        <dd className="text-xs text-gray-600 font-medium">
                          {sim.lastSeen ? format(new Date(sim.lastSeen), 'MMM dd, HH:mm') : '-'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
                        {t('modemDetail.assignedUser')}
                      </p>
                      {assignedUser ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold uppercase">
                              {assignedUser.username[0]}
                            </div>
                            <span className="text-sm font-semibold">{assignedUser.username}</span>
                          </div>
                          <button
                            onClick={handleUnassign}
                            disabled={isUnassigning}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                            title={t('modemDetail.noUserAssigned')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">{t('modemDetail.noUserAssigned')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">{t('modemDetail.noSimConnected')}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Balance History Tab */}
        {activeTab === 'balance' && (
          <div className="card animate-in fade-in duration-200">
            <div className="card-body max-h-[500px] overflow-y-auto">
              {balanceHistory.length > 0 ? (
                <div className="space-y-4">
                  {balanceHistory.map((b) => (
                    <div key={b._id} className="flex gap-4 relative pb-4">
                      {/* Timeline line */}
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-100" />
                      {/* Dot */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        b.source === 1 ? 'bg-blue-50 text-blue-500' :
                        b.source === 2 ? 'bg-brand-50 text-brand-500' :
                        b.source === 3 ? 'bg-red-50 text-red-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {b.source === 1 ? (
                          <RadioTower className="h-3 w-3" />
                        ) : b.source === 2 ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-sm text-gray-900">
                            {b.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            {b.recordedAt ? format(new Date(b.recordedAt), 'MMM dd, HH:mm') : '-'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.source === 0 ? t('modemDetail.ussdCheck') : b.source === 1 ? t('modemDetail.smsCredit') : b.source === 2 ? t('modemDetail.settlement') : b.source === 4 ? t('modemDetail.withdrawal') : t('modemDetail.other')}{' '}
                          {b.previousBalance !== null && (
                            <span className="text-gray-300">
                              &middot; {t('modemDetail.was')} {b.previousBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} DA
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <History className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">{t('modemDetail.noBalanceHistory')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SMS Tab */}
        {activeTab === 'sms' && (
          <div className="card animate-in fade-in duration-200">
            <div className="card-header flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">{t('modemDetail.smsMessages')}</h4>
              <span className="text-[11px] text-gray-400">{smsCount} {t('modemDetail.total')}</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {smsRecords.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {smsRecords.map((sms) => {
                    const initials = sms.senderNumber.length >= 2 ? sms.senderNumber.slice(-2) : sms.senderNumber
                    return (
                      <div key={sms._id} className="px-5 py-4 table-row-hover">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 uppercase">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{sms.senderNumber}</span>
                              <span className="text-[10px] text-gray-300">&middot;</span>
                              <span className="text-[11px] text-gray-400">
                                {sms.receivedAt ? format(new Date(sms.receivedAt), 'MMM dd, HH:mm') : '-'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{sms.content}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">{t('modemDetail.noSmsRecords')}</p>
                </div>
              )}
            </div>
            {smsCount > 20 && (
              <div className="px-5 py-2.5 border-t border-gray-100 text-center">
                <span className="text-[11px] text-gray-400">{t('modemDetail.showingOf', { count: smsCount })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
