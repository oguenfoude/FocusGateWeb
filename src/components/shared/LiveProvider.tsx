'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { smsTypeLabel } from '@/lib/sms-classifier'
import { BALANCE_WARN_THRESHOLD } from '@/lib/balance-alert'
import { t } from '@/lib/i18n'

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const esRef = useRef<EventSource | null>(null)
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return

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
          toast.success(`Balance: +${data.delta} DA`, {
            description: `${t('users.detail.walletBalance')}: ${data.balance.toLocaleString()} DA`,
          })
        }

        if (event === 'balance_warning') {
          toast.warning(`${t('warnings.title')}`, {
            description: `${t('warnings.balance')}: ${data.balance.toLocaleString()} DA — ${BALANCE_WARN_THRESHOLD.toLocaleString()} DA`,
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
  }, [status])

  return <>{children}</>
}
