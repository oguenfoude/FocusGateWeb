import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { toNum, toNumOrNull } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const resolvedParams = await params
    const id = Number(resolvedParams.id) || resolvedParams.id

    const modem = await Modem.findOne({ _id: id, archivedAt: null }).lean()
    if (!modem) {
      return Response.json({ error: 'Modem not found' }, { status: 404 })
    }

    const twoMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    const isOnline = modem.status === 4 && modem.updatedAt && new Date(modem.updatedAt) > twoMinAgo

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
      })

      smsCount = count
      smsRecords = sms.map(s => ({ ...s, _id: String(s._id) }))

      return Response.json({
        modem: { ...modem, _id: String(modem._id), isOnline },
        sim: { ...sim, _id: String(sim._id), balance: toNum(sim.balance) },
        assignedUser: assignedUser ? { ...assignedUser, _id: String(assignedUser._id), balance: toNum(assignedUser.balance) } : null,
        balanceHistory,
        smsRecords: smsRecords.map(s => ({ ...s, _id: String(s._id) })),
        smsCount,
      })
    }

    const assignedUser = await assignedUserPromise

    return Response.json({
      modem: { ...modem, _id: String(modem._id), isOnline },
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
