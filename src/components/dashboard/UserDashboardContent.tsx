'use client'

import { useLanguage } from '@/components/language-provider'
import Link from 'next/link'
import { RadioTower, Wallet, CalendarRange, Clock, Smartphone, MessageSquare, History, Banknote, ChevronRight, Inbox } from 'lucide-react'

interface SmsWithRelations {
  _id: { toString(): string }
  receivedAt: string | Date
  senderNumber?: string
  content?: string
  simCardId?: {
    phoneNumber?: string
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

export function UserDashboardContent({ data }: { data: DashboardData }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <RadioTower className="h-5 w-5 text-brand-500" />
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
                  {data.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">DA</p>
              </div>
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Credits */}
        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('history.amountCredited')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.totalCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">DA</p>
              </div>
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <CalendarRange className="h-5 w-5 text-purple-500" />
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
                  {data.pendingAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-2">DA</p>
              </div>
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/sims" className="card group cursor-pointer hover:border-brand-300 transition-colors">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <Smartphone className="h-4 w-4 text-brand-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{t('nav.mySims')}</p>
              <p className="text-xs text-gray-400">{data.totalModems} SIM</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/sms" className="card group cursor-pointer hover:border-purple-300 transition-colors">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{t('nav.mySms')}</p>
              <p className="text-xs text-gray-400">{t('sms.recentSms')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/history" className="card group cursor-pointer hover:border-blue-300 transition-colors">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <History className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{t('nav.history')}</p>
              <p className="text-xs text-gray-400">{t('history.title')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-blue-400 transition-colors flex-shrink-0" />
          </div>
        </Link>
        <Link href="/dashboard/withdraw" className="card group cursor-pointer hover:border-amber-300 transition-colors">
          <div className="card-body flex items-center gap-3 py-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Banknote className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{t('nav.withdraw')}</p>
              <p className="text-xs text-gray-400">{t('withdraw.subtitle')}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-amber-400 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Recent SMS */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.recentSms')}</h3>
          <span className="text-xs text-gray-400">{data.recentSms.length} {t('dashboard.messages')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden lg:table">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.date')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sender')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.content')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sim')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentSms.length > 0 ? (
                data.recentSms.map((sms) => {
                  const date = new Date(sms.receivedAt)
                  const senderStr = sms.senderNumber || t('common.unknown')
                  const initials = senderStr.length >= 2 ? senderStr.slice(-2) : senderStr
                  const simCard = sms.simCardId

                  return (
                    <tr key={sms._id.toString()} className="table-row-hover">
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })},{' '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 uppercase">
                            {initials}
                          </div>
                          <span className="font-medium text-xs">{senderStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate text-xs">
                        {sms.content}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-[11px]">
                        {simCard?.phoneNumber || 'N/A'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Inbox className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">{t('dashboard.noSms')}</p>
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
                  <div key={sms._id.toString()} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-xs text-gray-900">{senderStr}</span>
                      <span className="text-[11px] text-gray-400">
                        {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })},{' '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">{sms.content}</p>
                    <span className="text-[10px] text-gray-400">{simCard?.phoneNumber || 'N/A'}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Inbox className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('dashboard.noSms')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
