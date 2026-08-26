import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { toNum, toNumOrNull } from '@/lib/number-utils'
import { requireAdmin, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function stripComPort(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  delete result.comPort
  return result
}

async function findModemByLegacySafeId(id: string) {
  const numId = Number(id)
  let modem = await Modem.findOne({ _id: numId, archivedAt: null }).lean()
  if (!modem && id !== String(numId)) {
    const col = mongoose.connection.db!.collection('modems')
    const raw = await col.findOne({ _id: id } as Record<string, unknown>)
    if (raw && (raw.archivedAt === null || raw.archivedAt === undefined)) {
      modem = raw as Awaited<typeof modem>
    }
  }
  return modem
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkRateLimit(req, 'admin', 60, 60_000)) {
      return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    let auth
    try {
      auth = await requireAdmin(req)
    } catch (e) {
      if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status })
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const modem = await findModemByLegacySafeId(resolvedParams.id)
    if (!modem) {
      return Response.json({ error: 'Modem not found' }, { status: 404 })
    }

    const isOnline = modem.status === 4

    const SimCard = (await import('@/lib/models/SimCard')).SimCard
    const UserModem = (await import('@/lib/models/UserModem')).UserModem
    const User = (await import('@/lib/models/User')).User
    const BalanceHistory = (await import('@/lib/models/BalanceHistory')).BalanceHistory
    const SmsRecord = (await import('@/lib/models/SmsRecord')).SmsRecord

    const [sim, userModem] = await Promise.all([
      SimCard.findOne({ modemId: modem._id, isActive: true, archivedAt: null }).lean(),
      UserModem.findOne({ modemId: modem._id, removedAt: null, archivedAt: null }).lean(),
    ])

    const assignedUserPromise = userModem
      ? User.findOne({ _id: userModem.userId }).select('-password').lean()
      : Promise.resolve(null)

    let balanceHistory: Record<string, unknown>[] = []
    let smsRecords: Record<string, unknown>[] = []
    let smsCount = 0

    if (sim) {
      const [assignedUser, bh, count, sms] = await Promise.all([
        assignedUserPromise,
        BalanceHistory.find({ simCardId: sim._id, archivedAt: null })
          .sort({ recordedAt: -1 }).limit(50).lean(),
        SmsRecord.countDocuments({ simCardId: sim._id, archivedAt: null }),
        SmsRecord.find({ simCardId: sim._id, archivedAt: null })
          .sort({ receivedAt: -1 }).limit(20).lean(),
      ])

      balanceHistory = bh.map((b: Record<string, unknown>) => {
        const bal = toNum(b.balance)
        const prevBal = toNumOrNull(b.previousBalance)
        return {
          ...b,
          _id: String(b._id),
          balance: bal,
          previousBalance: prevBal,
          delta: prevBal != null ? bal - prevBal : bal,
        }
      }).filter(b => b.previousBalance != null ? b.balance > b.previousBalance : b.balance > 0)

      smsCount = count
      smsRecords = sms.map(s => ({ ...s, _id: String(s._id) }))

      return Response.json({
        modem: { ...stripComPort(modem), _id: String(modem._id), imei: (modem as any).iMEI || modem.imei, isOnline },
        sim: { ...sim, _id: String(sim._id), balance: toNum(sim.balance) },
        assignedUser: assignedUser ? { ...assignedUser, _id: String(assignedUser._id), balance: toNum(assignedUser.balance) } : null,
        balanceHistory,
        smsRecords: smsRecords.map(s => ({ ...s, _id: String(s._id) })),
        smsCount,
      })
    }

    const assignedUser = await assignedUserPromise

    return Response.json({
      modem: { ...stripComPort(modem), _id: String(modem._id), imei: (modem as any).iMEI || modem.imei, isOnline },
      sim: null,
      assignedUser: assignedUser ? { ...assignedUser, _id: String(assignedUser._id), balance: toNum(assignedUser.balance) } : null,
      balanceHistory,
      smsRecords,
      smsCount,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkRateLimit(req, 'admin', 60, 60_000)) {
      return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    let auth
    try {
      auth = await requireAdmin(req)
    } catch (e) {
      if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status })
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const id = Number(resolvedParams.id) || resolvedParams.id

    const body = await req.json().catch(() => ({}))
    const { action } = body

    if (action === 'unassign') {
      const UserModem = (await import('@/lib/models/UserModem')).UserModem
      const userModem = await UserModem.findOne({ modemId: id, removedAt: null, archivedAt: null })
      if (!userModem) {
        return Response.json({ error: 'Assignment not found' }, { status: 404 })
      }

      await UserModem.updateOne(
        { _id: userModem._id },
        { $set: { removedAt: new Date(), updatedAt: new Date() } }
      )

      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
