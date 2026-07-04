'use client'

import useSWR from 'swr'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info, MessageSquare, Loader2, Inbox } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { formatShortDate, formatTimeAgo } from '@/lib/date-utils'

interface SmsItemType {
  id: string
  sender: string
  isOffer?: boolean
  type?: string
  typeLabel?: string
  content?: string
  receivedAt?: string
  simPhoneNumber?: number | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SmsList({ userId }: { userId: string }) {
  const { t, locale } = useLanguage()
  const { data, error, isLoading } = useSWR(
    userId ? `/api/dashboard/sms?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block card page-enter delay-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start border-collapse">
            <thead className="border-b border-gray-200/50">
              <tr>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboardSms.sender')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboardSms.type')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboardSms.content')}</th>
                <th className="px-5 py-4 text-start text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('sms.sim')}</th>
                <th className="px-5 py-4 text-end text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboardSms.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                      <p className="text-gray-400 font-medium animate-pulse text-sm">{t('dashboardSms.loading')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="text-red-500 font-medium text-sm">{t('dashboardSms.failedToLoad')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{t('dashboardSms.noRecords')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((sms: SmsItemType) => (
                <tr key={sms.id} className="table-row-hover">
                  <td className="px-5 py-4 font-bold text-sm text-gray-900 tracking-tight">{sms.sender}</td>
                  <td className="px-5 py-4">
                    {sms.isOffer ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="cursor-help badge badge-warning">{sms.typeLabel ? t(sms.typeLabel) : ''}<Info className="h-3 w-3 ml-1" /></span>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('dashboardSms.promoTooltip')}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : sms.type === 'recharge' ? (
                      <span className="badge badge-info">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
                    ) : sms.type === 'transfer' ? (
                      <span className="badge badge-success">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
                    ) : (
                      <span className="badge badge-gray">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600 max-w-xl whitespace-pre-wrap">{sms.content}</td>
                  <td className="px-5 py-4">
                    <span className="badge badge-gray font-mono text-[10px]">{sms.simPhoneNumber || t('common.unknown')}</span>
                  </td>
                  <td className="px-5 py-4 text-end">
                    <div className="text-gray-500 font-medium text-xs">{sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-1">{sms.receivedAt ? formatShortDate(sms.receivedAt, locale) : ''}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading && (
          <div className="card card-body p-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-gray-400 font-medium animate-pulse text-sm">{t('common.loading')}</p>
          </div>
        )}
        {error && (
          <div className="card card-body p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-red-500 font-medium text-sm">{t('common.error')}</p>
          </div>
        )}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((sms: SmsItemType) => (
          <div key={sms.id} className="card card-body p-4 page-enter delay-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-gray-900">{sms.sender}</span>
              <span className="text-[11px] text-gray-400 font-medium">{sms.receivedAt ? formatTimeAgo(new Date(sms.receivedAt), locale) : '-'}</span>
            </div>
            <div className="mb-2">
              {sms.isOffer ? (
                <span className="badge badge-warning">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
              ) : sms.type === 'recharge' ? (
                <span className="badge badge-info">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
              ) : sms.type === 'transfer' ? (
                <span className="badge badge-success">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
              ) : (
                <span className="badge badge-gray">{sms.typeLabel ? t(sms.typeLabel) : ''}</span>
              )}
            </div>
            {sms.content && <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">{sms.content}</p>}
            <div className="mt-2">
              <span className="badge badge-gray font-mono text-[10px]">{sms.simPhoneNumber || t('common.unknown')}</span>
            </div>
          </div>
        ))}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-gray-500 text-sm font-medium">{t('dashboardSms.noRecords')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
