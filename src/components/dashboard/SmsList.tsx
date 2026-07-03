'use client'

import useSWR from 'swr'
import { formatDistanceToNow, format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

interface SmsItemType {
  id: string
  sender: string
  isOffer?: boolean
  type?: string
  typeLabel?: string
  content?: string
  receivedAt?: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function SmsList({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { data, error, isLoading } = useSWR(
    userId ? `/api/dashboard/sms?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden lg:block card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('dashboardSms.sender')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('dashboardSms.type')}</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('dashboardSms.content')}</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('dashboardSms.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400 animate-pulse">{t('dashboardSms.loading')}</td></tr>}
              {error && <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-red-500">{t('dashboardSms.failedToLoad')}</td></tr>}
              {!isLoading && !error && (!data || !Array.isArray(data) || data.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">{t('dashboardSms.noRecords')}</td></tr>
              )}
              {!isLoading && !error && Array.isArray(data) && data.map((sms: SmsItemType) => (
                <tr key={sms.id} className="table-row-hover">
                  <td className="px-5 py-3 font-bold text-xs text-gray-900">{sms.sender}</td>
                  <td className="px-5 py-3">
                    {sms.isOffer ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="cursor-help badge badge-warning">{sms.typeLabel}<Info className="h-3 w-3 ml-1" /></span>
                          </TooltipTrigger>
                          <TooltipContent><p>{t('dashboardSms.promoTooltip')}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : sms.type === 'recharge' ? (
                      <span className="badge badge-info">{sms.typeLabel}</span>
                    ) : sms.type === 'transfer' ? (
                      <span className="badge badge-success">{sms.typeLabel}</span>
                    ) : (
                      <span className="badge badge-gray">{sms.typeLabel}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-900 max-w-xl whitespace-pre-wrap">{sms.content}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="text-gray-500 font-medium text-xs">{sms.receivedAt ? formatDistanceToNow(new Date(sms.receivedAt), { addSuffix: true }) : '-'}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{sms.receivedAt ? format(new Date(sms.receivedAt), 'dd MMM yyyy HH:mm') : ''}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {isLoading && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-gray-400 animate-pulse text-xs">{t('common.loading')}</div>}
        {error && <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-red-500 text-xs">{t('common.error')}</div>}
        {!isLoading && !error && Array.isArray(data) && data.length > 0 && data.map((sms: SmsItemType) => (
          <div key={sms.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-gray-900">{sms.sender}</span>
              <span className="text-[11px] text-gray-400">{sms.receivedAt ? formatDistanceToNow(new Date(sms.receivedAt), { addSuffix: true }) : '-'}</span>
            </div>
            <div className="mb-2">
              {sms.isOffer ? (
                <span className="badge badge-warning">{sms.typeLabel}</span>
              ) : sms.type === 'recharge' ? (
                <span className="badge badge-info">{sms.typeLabel}</span>
              ) : sms.type === 'transfer' ? (
                <span className="badge badge-success">{sms.typeLabel}</span>
              ) : (
                <span className="badge badge-gray">{sms.typeLabel}</span>
              )}
            </div>
            {sms.content && <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap">{sms.content}</p>}
          </div>
        ))}
        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400 text-xs">{t('dashboardSms.noRecords')}</div>
        )}
      </div>
    </div>
  )
}
