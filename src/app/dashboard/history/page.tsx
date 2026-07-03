'use client'

import { useState, useEffect } from 'react'
import { HistoryList } from '@/components/dashboard/HistoryList'
import { PageHeader } from '@/components/shared/PageHeader'

export default function DashboardHistoryPage() {
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
        titleKey="history.title"
        subtitleKey="history.subtitle"
        iconName="History"
        color="purple"
      />
      <HistoryList userId={userId} />
    </div>
  )
}
