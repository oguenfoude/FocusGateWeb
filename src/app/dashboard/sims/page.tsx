'use client'

import useSWR from 'swr'
import { useSyncExternalStore } from 'react'
import { SimCardItem } from '@/components/dashboard/SimCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { useLanguage } from '@/components/language-provider'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

interface SimCardData {
  modemId: string
  phoneNumber: number | null
  isOnline: boolean
  lastSeen: string | null
  model: string | null
  brand: number | null
  balance: number
}

export default function DashboardSimsPage() {
  const { t } = useLanguage()
  const userId = useSyncExternalStore(
    subscribe,
    () => getLocalStorage('userId'),
    () => null,
  )

  const { data, error, isLoading } = useSWR(
    userId ? `/api/dashboard/sims?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

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
        titleKey="mySims.title"
        subtitleKey="mySims.subtitle"
        iconName="Smartphone"
        color="emerald"
      />

      {isLoading && <div className="p-8 text-center text-gray-400 animate-pulse">{t('common.loading')}</div>}
      {error && <div className="p-8 text-center text-red-500">{t('common.error')}</div>}
      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="p-12 text-center border rounded-lg bg-white text-gray-400">
          {t('mySims.noSims')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading && !error && data?.map((sim: SimCardData) => (
          <SimCardItem
            key={sim.modemId}
            {...sim}
          />
        ))}
      </div>
    </div>
  )
}
