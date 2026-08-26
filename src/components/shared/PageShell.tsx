'use client'

import { Loader2, Inbox } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

interface PageShellProps {
  isLoading?: boolean
  error?: boolean
  empty?: boolean
  emptyIcon?: React.ReactNode
  emptyMessage?: string
  children: React.ReactNode
}

export function PageShell({ isLoading, error, empty, emptyIcon, emptyMessage, children }: PageShellProps) {
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{t('common.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <Inbox className="h-5 w-5 text-red-400" />
        </div>
        <p className="text-sm text-red-500 font-medium">{t('common.error')}</p>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
          {emptyIcon || <Inbox className="h-5 w-5" />}
        </div>
        <p className="text-sm text-gray-400 font-medium">{emptyMessage || t('common.noData')}</p>
      </div>
    )
  }

  return <>{children}</>
}
