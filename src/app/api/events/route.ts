import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { BalanceHistory } from '@/lib/models/BalanceHistory'
import { UserModem } from '@/lib/models/UserModem'
import { SimCard } from '@/lib/models/SimCard'
import { classifySms } from '@/lib/sms-classifier'
import { isNearLimit } from '@/lib/balance-alert'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const userId = session.user.id
  const isAdmin = session.user.role === 'admin'

  const encoder = new TextEncoder()
  let since = new Date()
  let isClosed = false
  let interval: NodeJS.Timeout | null = null
  let streamController: ReadableStreamDefaultController | null = null

  function cleanup() {
    if (isClosed) return
    isClosed = true
    if (interval) {
      clearInterval(interval)
    }
    if (streamController) {
      try {
        streamController.close()
      } catch {
        // already closed
      }
    }
  }

  req.signal.addEventListener('abort', cleanup)

  const stream = new ReadableStream({
    async start(controller) {
      streamController = controller
      try {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      } catch {
        cleanup()
        return
      }

      interval = setInterval(async () => {
        if (isClosed) return
        try {
          await connectDB()

          let simIds: (string | number)[] = []
          if (!isAdmin) {
            const assignments = await UserModem.find({ userId, removedAt: null, archivedAt: null }).lean()
            const modemIds = assignments.map(a => a.modemId)
            if (modemIds.length > 0) {
              const sims = await SimCard.find({ modemId: { $in: modemIds }, archivedAt: null, isActive: true }).lean()
              simIds = sims.map(s => s._id)
            }
          }

          if (isClosed) return

          const smsFilter: Record<string, unknown> = isAdmin
            ? { updatedAt: { $gt: since }, archivedAt: null }
            : { simCardId: { $in: simIds }, updatedAt: { $gt: since }, archivedAt: null }

          const balFilter: Record<string, unknown> = isAdmin
            ? { updatedAt: { $gt: since }, source: { $in: [1, 2] }, archivedAt: null }
            : { userId, updatedAt: { $gt: since }, source: { $in: [1, 2] }, archivedAt: null }

          const [newSms, newBal] = await Promise.all([
            SmsRecord.find(smsFilter).limit(100).lean(),
            BalanceHistory.find(balFilter).limit(100).lean(),
          ])

          if (isClosed) return

          for (const sms of newSms) {
            if (isClosed) break
            const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
            const payload = JSON.stringify({
              event: 'sms',
              data: {
                id: String(sms._id),
                sender: sms.senderNumber,
                content: sms.content,
                receivedAt: sms.receivedAt,
                type,
                isOffer: type === 'offer',
              },
            })
            try {
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
            } catch {
              cleanup()
              return
            }
          }

          for (const b of newBal) {
            if (isClosed) break
            const nearLimit = isNearLimit(b.balance ?? 0)
            const payload = JSON.stringify({
              event: 'balance',
              data: {
                id: String(b._id),
                simCardId: b.simCardId,
                balance: b.balance,
                delta: (b.balance ?? 0) - (b.previousBalance ?? 0),
                nearLimit,
              },
            })
            try {
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
            } catch {
              cleanup()
              return
            }

            if (nearLimit) {
              if (isClosed) break
              const warn = JSON.stringify({
                event: 'balance_warning',
                data: { simCardId: b.simCardId, balance: b.balance },
              })
              try {
                controller.enqueue(encoder.encode(`data: ${warn}\n\n`))
              } catch {
                cleanup()
                return
              }
            }
          }

          since = new Date()
        } catch {
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode(': poll_error\n\n'))
            } catch {
              cleanup()
            }
          }
        }
      }, 30000)
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
