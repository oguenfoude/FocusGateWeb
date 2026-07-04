'use client'

import { useUserId } from '@/components/user-id-provider'
import { UserDashboardContent } from '@/components/dashboard/UserDashboardContent'
import { useLanguage } from '@/components/language-provider'
import { Inbox } from 'lucide-react'

export default function UserDashboardPage() {
  const userId = useUserId()
  const { t } = useLanguage()

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="card max-w-sm w-full p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 mb-2">
            <Inbox className="h-8 w-8" />
          </div>
          <p className="text-gray-900 font-bold tracking-tight">{t('common.unknown')}</p>
          <p className="text-gray-500 text-sm">{t('common.pleaseLogIn')}</p>
        </div>
      </div>
    )
  }

  return <UserDashboardContent userId={userId} />
}
