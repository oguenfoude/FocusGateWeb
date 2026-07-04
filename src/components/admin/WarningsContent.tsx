'use client'

import { useLanguage } from '@/components/language-provider'
import Link from 'next/link'
import { Inbox, Eye } from 'lucide-react'

interface WarningItem {
  _id: number
  phoneNumber?: number
  balance: number
  modemId: number
}

export function WarningsContent({ warnings }: { warnings: WarningItem[] }) {
  const { t, locale } = useLanguage()
  const loc = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar-DZ' : 'en-US'

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t('warnings.alerts')}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            warnings.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {warnings.length === 1 ? t('warnings.countSingular', { count: warnings.length }) : t('warnings.count', { count: warnings.length })}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-start text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('warnings.phone')}</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('warnings.balance')}</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {warnings.length > 0 ? (
                warnings.map((w) => (
                  <tr key={w._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-900">{w.phoneNumber || t('common.unknown')}</td>
                    <td className="px-6 py-3.5 font-bold text-amber-600">{w.balance.toLocaleString(loc, { minimumFractionDigits: 2 })} DA</td>
                    <td className="px-6 py-3.5 text-end">
                      <Link href={`/admin/modems/${w.modemId}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye className="h-3 w-3" /> {t('warnings.viewModem')}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">{t('warnings.allNormal')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {warnings.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">{warnings.length === 1 ? t('warnings.countSingular', { count: warnings.length }) : t('warnings.count', { count: warnings.length })}</span>
            </div>
            {warnings.map((w) => (
              <div key={w._id} className="card card-body p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">{w.phoneNumber || t('common.unknown')}</span>
                  <span className="font-bold text-sm text-amber-600">{w.balance.toLocaleString(loc, { minimumFractionDigits: 2 })} DA</span>
                </div>
                <Link href={`/admin/modems/${w.modemId}`} className="btn btn-outline btn-sm w-full justify-center h-[32px] mt-2">
                  <Eye className="h-3 w-3" /> {t('warnings.viewModem')}
                </Link>
              </div>
            ))}
          </>
        ) : (
          <div className="card p-8 text-center max-w-sm mx-auto shadow-sm border-gray-100">
            <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('warnings.allNormal')}</p>
          </div>
        )}
      </div>
    </>
  )
}
