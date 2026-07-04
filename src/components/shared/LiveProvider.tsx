'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { smsTypeLabel } from '@/lib/sms-classifier'
import { BALANCE_WARN_THRESHOLD } from '@/lib/balance-alert'
import { useLanguage } from '@/components/language-provider'

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const esRef = useRef<EventSource | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const es = new EventSource('/api/events')
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data)

        if (event === 'sms') {
          if (data.isOffer) {
            toast.info(`${t('dashboard.recentSms')} — ${data.sender}`, {
              description: t('dashboardSms.promoTooltip'),
              duration: 8000,
            })
          } else {
            toast.success(`${t('sms.sender')}: ${data.sender}`, {
              description: `${t('sms.type')}: ${smsTypeLabel(data.type)}`,
            })
          }
        }

        if (event === 'balance') {
          toast.success(t('usersDetail.balanceChanged', { delta: data.delta.toLocaleString() }), {
            description: t('usersDetail.balanceChangedDesc', { balance: data.balance.toLocaleString() }),
          })
        }

        if (event === 'balance_warning') {
          toast.warning(`${t('warnings.title')}`, {
            description: `${t('warnings.balance')}: ${data.balance.toLocaleString()} ${t('common.da')} — ${BALANCE_WARN_THRESHOLD.toLocaleString()} ${t('common.da')}`,
            duration: 10000,
          })
        }
      } catch {
        // ignore parse errors from heartbeats
      }
    }

    es.onerror = () => {
      // Browser will auto-reconnect EventSource
    }

    return () => es.close()
  }, [t])

  return <>{children}</>
}
