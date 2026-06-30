'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { smsTypeLabel } from '@/lib/sms-classifier'
import { BALANCE_WARN_THRESHOLD } from '@/lib/balance-alert'

interface LiveCtx { unreadSms: number }
const Ctx = createContext<LiveCtx>({ unreadSms: 0 })

export const useLive = () => useContext(Ctx)

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
            toast.info(`🎁 Offer / Flixy received from ${data.sender}`, {
              description: 'This is a promotional offer — not credited to your balance.',
              duration: 8000,
            })
          } else {
            toast.success(`New SMS from ${data.sender}`, {
              description: `Type: ${smsTypeLabel(data.type)}`,
            })
          }
        }

        if (event === 'balance') {
          toast.success(`Balance updated: +${data.delta} DA`, {
            description: `New balance: ${data.balance.toLocaleString()} DA`,
          })
        }

        if (event === 'balance_warning') {
          toast.warning(`⚠️ SIM balance approaching limit`, {
            description: `Current: ${data.balance.toLocaleString()} DA — limit is ${BALANCE_WARN_THRESHOLD.toLocaleString()} DA`,
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

  return <Ctx.Provider value={{ unreadSms: 0 }}>{children}</Ctx.Provider>
}
