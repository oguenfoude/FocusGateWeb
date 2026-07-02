import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { User } from '@/lib/models/User'
import { BalanceHistory } from '@/lib/models/BalanceHistory'
import { SmsRecord } from '@/lib/models/SmsRecord'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const id = Number(resolvedParams.id) || resolvedParams.id

    const modem = await Modem.findOne({ _id: id, archivedAt: null }).lean()
    if (!modem) {
      return Response.json({ error: 'Modem not found' }, { status: 404 })
    }

    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000)
    const isOnline = modem.status === 4 && modem.updatedAt && new Date(modem.updatedAt) > twoMinAgo

    // Phase 1: sim + userModem (both need modem._id)
    const [sim, userModem] = await Promise.all([
      SimCard.findOne({ modemId: modem._id, isActive: true, archivedAt: null }).lean(),
      UserModem.findOne({ modemId: modem._id, removedAt: null, archivedAt: null }).lean(),
    ])

    // Phase 2: assigned user (needs userModem) + sim-dependent queries (need sim)
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
        const bal = b.balance != null ? Number(b.balance.toString()) : 0
        const prevBal = b.previousBalance != null ? Number(b.previousBalance.toString()) : 0
        return {
          ...b,
          _id: String(b._id),
          balance: bal,
          previousBalance: prevBal,
          delta: bal - prevBal,
        }
      })

      smsCount = count
      smsRecords = sms.map(s => ({ ...s, _id: String(s._id) }))

      return Response.json({
        modem: { ...modem, _id: String(modem._id), isOnline },
        sim: { ...sim, _id: String(sim._id), balance: sim.balance != null ? Number(sim.balance.toString()) : 0 },
        assignedUser: assignedUser ? { ...assignedUser, _id: String(assignedUser._id), balance: Number(assignedUser.balance) || 0 } : null,
        balanceHistory,
        smsRecords: smsRecords.map(s => ({ ...s, _id: String(s._id) })),
        smsCount,
      })
    }

    // No sim — still resolve assigned user if present
    const assignedUser = await assignedUserPromise

    return Response.json({
      modem: { ...modem, _id: String(modem._id), isOnline },
      sim: null,
      assignedUser: assignedUser ? { ...assignedUser, _id: String(assignedUser._id), balance: Number(assignedUser.balance) || 0 } : null,
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
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const id = Number(resolvedParams.id) || resolvedParams.id

    const body = await req.json().catch(() => ({}))
    const { action } = body

    if (action === 'unassign') {
      const userModem = await UserModem.findOne({ modemId: id, removedAt: null, archivedAt: null })
      if (userModem) {
        userModem.removedAt = new Date()
        userModem.updatedAt = new Date()
        await userModem.save()
        return Response.json({ ok: true })
      }
      return Response.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
