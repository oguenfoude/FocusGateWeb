'use client'

import { Suspense } from 'react'
import { SmsList } from '@/components/dashboard/SmsList'
import { PageHeader } from '@/components/shared/PageHeader'

import { useUserId } from '@/components/user-id-provider'
import { MessageSquare } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

function DashboardSmsContent() {
  const userId = useUserId()
  const { t } = useLanguage()

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="card max-w-sm w-full p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 mb-2">
            <MessageSquare className="h-8 w-8" />
          </div>
          <p className="text-gray-900 font-bold tracking-tight">{t('common.unknown')}</p>
          <p className="text-gray-500 text-sm">{t('common.pleaseLogIn')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="sms.recentSms"
        subtitleKey="sms.lastSmsDescription"
        iconName="MessageSquare"
        color="blue"
      />
      <SmsList userId={userId} />
    </div>
  )
}

export default function DashboardSmsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
        </div>
      </div>
    }>
      <DashboardSmsContent />
    </Suspense>
  )
}
