'use client'

import useSWR from 'swr'
import { SimCardItem } from '@/components/dashboard/SimCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { useLanguage } from '@/components/language-provider'

const fetcher = (url: string) => fetch(url).then(r => r.json())

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
  const { data, error, isLoading } = useSWR('/api/dashboard/sims', fetcher, {
    refreshInterval: 30000,
  })

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
