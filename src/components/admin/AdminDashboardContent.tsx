'use client'

import { useLanguage } from '@/components/language-provider'
import { StatCards } from '@/components/admin/StatCards'
import { QuickActions } from '@/components/admin/QuickActions'
import { Inbox } from 'lucide-react'
import { formatShortDate } from '@/lib/date-utils'

interface SmsItem {
  _id: string
  senderNumber?: string
  content?: string
  receivedAt?: string
  simPhoneNumber?: string
}

interface DashboardData {
  modemsTotal: number
  modemsOnline: number
  simCount: number
  totalSimBalance: number
  userCount: number
  totalUserBalance: number
  pendingWithdrawals: number
  recentSms: SmsItem[]
}

export function AdminDashboardContent({ data }: { data: DashboardData }) {
  const { t, locale } = useLanguage()

  return (
    <div className="space-y-6 max-w-[1400px]">
      <StatCards
        modemsTotal={data.modemsTotal}
        modemsOnline={data.modemsOnline}
        totalSimBalance={data.totalSimBalance}
        simCount={data.simCount}
        totalUserBalance={data.totalUserBalance}
        userCount={data.userCount}
        pendingWithdrawals={data.pendingWithdrawals}
      />

      <QuickActions
        modemsTotal={data.modemsTotal}
        userCount={data.userCount}
        pendingWithdrawals={data.pendingWithdrawals}
      />

      {/* Recent SMS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.recentSms')}</h3>
          <span className="text-xs text-gray-400">{data.recentSms.length} {t('dashboard.messages')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm hidden lg:table">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.date')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sender')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.content')}</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('sms.sim')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentSms.length > 0 ? (
                data.recentSms.map((sms) => {
                  const senderStr = sms.senderNumber || t('common.unknown')
                  const initials = senderStr.length >= 2 ? senderStr.slice(-2) : senderStr

                  return (
                    <tr key={sms._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {sms.receivedAt ? formatShortDate(sms.receivedAt, locale) : '-'}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 uppercase">
                            {initials}
                          </div>
                          <span className="font-medium text-xs text-gray-900">{senderStr}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-500 max-w-xs truncate text-xs">
                        {sms.content}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {sms.simPhoneNumber || 'N/A'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{t('dashboard.noSms')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="lg:hidden space-y-3 p-4">
            {data.recentSms.length > 0 ? (
              data.recentSms.map((sms) => {
                const senderStr = sms.senderNumber || t('common.unknown')

                return (
                    <div key={sms._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-xs text-gray-900">{senderStr}</span>
                      <span className="text-[11px] text-gray-400">
                        {sms.receivedAt ? formatShortDate(sms.receivedAt, locale) : '-'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">{sms.content}</p>
                    <span className="text-[10px] text-gray-400">{sms.simPhoneNumber || 'N/A'}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t('dashboard.noSms')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
