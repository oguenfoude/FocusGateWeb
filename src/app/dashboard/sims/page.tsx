'use client'

import useSWR from 'swr'
import { SimCardItem } from '@/components/dashboard/SimCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { useLanguage } from '@/components/language-provider'
import { useUserId } from '@/components/user-id-provider'
import { Inbox, Smartphone } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface SimCardData {
  modemId: string
  phoneNumber: number | null
  isOnline: boolean
  lastSeen: string | null
  model: string | null
  brand: number | null
}

export default function DashboardSimsPage() {
  const { t } = useLanguage()
  const userId = useUserId()

  const { data, error, isLoading } = useSWR(
    userId ? `/api/dashboard/sims?userId=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 }
  )

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] page-enter delay-100">
        <div className="card max-w-sm w-full p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-400 mb-2">
            <Smartphone className="h-8 w-8" />
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
        titleKey="mySims.title"
        subtitleKey="mySims.subtitle"
        iconName="Smartphone"
        color="emerald"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20 page-enter delay-100">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
            <p className="text-gray-400 font-medium animate-pulse">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-20 page-enter delay-100">
          <div className="card p-8 text-center flex flex-col items-center max-w-sm w-full mx-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('common.error')}</h3>
            <p className="text-sm text-gray-500 mt-2">{t('common.failedToLoad')}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="flex items-center justify-center py-20 page-enter delay-100">
          <div className="card p-8 text-center flex flex-col items-center max-w-sm w-full mx-4 shadow-sm border-gray-100">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('mySims.noSims')}</h3>
            <p className="text-sm text-gray-500 mt-2">{t('mySims.noSims')}</p>
          </div>
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
