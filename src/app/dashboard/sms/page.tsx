'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SmsList } from '@/components/dashboard/SmsList'
import { PageHeader } from '@/components/shared/PageHeader'

function DashboardSmsContent() {
  const searchParams = useSearchParams()
  const urlUserId = searchParams.get('userId')

  let userId = urlUserId
  if (!userId && typeof window !== 'undefined') {
    try { userId = localStorage.getItem('userId') } catch {}
  }

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

export default function DashboardSmsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400 text-sm">Loading...</p></div>}>
      <DashboardSmsContent />
    </Suspense>
  )
}
