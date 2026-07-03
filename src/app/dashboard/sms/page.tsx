'use client'

import { useState, useEffect } from 'react'
import { SmsList } from '@/components/dashboard/SmsList'
import { PageHeader } from '@/components/shared/PageHeader'
import { useLanguage } from '@/components/language-provider'

export default function DashboardSmsPage() {
  const { t } = useLanguage()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    try { setUserId(localStorage.getItem('userId')) } catch {}
  }, [])

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-sm">No user ID provided.</p>
          <p className="text-gray-400 text-xs">Go to <code>/dashboard?userId=1</code> first.</p>
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
