'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { useLanguage } from '@/components/language-provider'
import Link from 'next/link'
import { RadioTower, Wallet, Clock, Smartphone, MessageSquare, History, Banknote, ChevronRight, Inbox } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SmsWithRelations {
  _id: { toString(): string }
  receivedAt: string | Date
  senderNumber?: string
  content?: string
  simCardId?: {
    phoneNumber?: number
    modemId?: {
      imei?: string
    }
  }
}

interface DashboardData {
  totalModems: number
  onlineModems: number
  balance: number
  totalCredits: number
  pendingAmount: number
  recentSms: SmsWithRelations[]
}

export function UserDashboardContent({ userId }: { userId: string }) {
  const { t, locale } = useLanguage()

  const { data, error, isLoading } = useSWR<DashboardData>(
    userId ? `/api/dashboard/overview?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  useEffect(() => {
    if (userId) {
      try { localStorage.setItem('userId', userId) } catch {}
    }
  }, [userId])

  const localeMap: Record<string, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-DZ' }
  const loc = localeMap[locale] || 'en-US'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="card p-8 text-center flex flex-col items-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('common.error')}</h3>
          <p className="text-sm text-gray-500 mt-2">{t('common.failedToLoad')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* My SIMs */}
        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('nav.mySims')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.onlineModems}<span className="text-lg text-gray-300 font-normal">/{data.totalModems}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
                  </span>
                  <span className="text-xs text-brand-600 font-medium">{data.onlineModems} {t('dashboard.online')}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-brand-100/50">
                <RadioTower className="h-6 w-6 text-brand-600" />
              </div>
            </div>
          </div>
        </div>

        {/* My Balance */}
        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('users.detail.walletBalance')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.balance.toLocaleString(loc, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">{t('common.da')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-blue-100/50">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('dashboard.pendingRequests')}</p>
                <p className={`text-3xl font-bold mt-2 ${data.pendingAmount > 0 ? 'text-amber-500' : 'text-gray-900'}`}>
                  {data.pendingAmount.toLocaleString(loc, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">{t('common.da')}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-amber-100/50">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/sims" className="card group cursor-pointer hover:border-brand-300 page-enter delay-100">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center group-hover:from-brand-200 group-hover:to-brand-100 transition-colors shadow-inner border border-brand-100/50">
              <Smartphone className="h-5 w-5 text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{t('nav.mySims')}</p>
              <p className="text-xs text-gray-400 font-medium">{data.totalModems} {t('dashboard.sims')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/sms" className="card group cursor-pointer hover:border-purple-300 page-enter delay-200">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-100 transition-colors shadow-inner border border-purple-100/50">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{t('nav.mySms')}</p>
              <p className="text-xs text-gray-400 font-medium">{t('sms.recentSms')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/history" className="card group cursor-pointer hover:border-blue-300 page-enter delay-300">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition-colors shadow-inner border border-blue-100/50">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{t('nav.history')}</p>
              <p className="text-xs text-gray-400 font-medium">{t('history.title')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/withdraw" className="card group cursor-pointer hover:border-amber-300 page-enter delay-300">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-100 transition-colors shadow-inner border border-amber-100/50">
              <Banknote className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{t('nav.withdraw')}</p>
              <p className="text-xs text-gray-400 font-medium">{t('withdraw.subtitle')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Recent SMS */}
      <div className="card page-enter delay-300">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">{t('dashboard.recentSms')}</h3>
          <span className="badge badge-gray">{data.recentSms.length} {t('dashboard.messages')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden lg:table border-collapse text-start">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.date')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sender')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.content')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sim')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentSms.length > 0 ? (
                data.recentSms.map((sms) => {
                  const date = new Date(sms.receivedAt)
                  const senderStr = sms.senderNumber || t('common.unknown')
                  const initials = senderStr.length >= 2 ? senderStr.slice(-2) : senderStr
                  const simCard = sms.simCardId

                  return (
                    <tr key={sms._id.toString()} className="table-row-hover">
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap font-medium">
                        {date.toLocaleDateString(loc, { month: 'short', day: '2-digit' })},{' '}
                        {date.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0 uppercase shadow-sm border border-brand-100">
                            {initials}
                          </div>
                          <span className="font-semibold text-xs text-gray-900 tracking-tight">{senderStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 max-w-xs truncate text-xs">
                        {sms.content}
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge badge-gray font-mono text-[10px]">{simCard?.phoneNumber || t('common.unknown')}</span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{t('dashboard.noSms')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="lg:hidden space-y-3 p-4">
            {data.recentSms.length > 0 ? (
              data.recentSms.map((sms) => {
                const date = new Date(sms.receivedAt)
                const senderStr = sms.senderNumber || t('common.unknown')
                const simCard = sms.simCardId

                return (
                  <div key={sms._id.toString()} className="card card-body p-4 table-row-hover">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-gray-900">{senderStr}</span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {date.toLocaleDateString(loc, { month: 'short', day: '2-digit' })},{' '}
                        {date.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-2">{sms.content}</p>
                    <span className="badge badge-gray font-mono text-[10px]">{simCard?.phoneNumber || t('common.unknown')}</span>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-gray-500 text-sm font-medium">{t('dashboard.noSms')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
