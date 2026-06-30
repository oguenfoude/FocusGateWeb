import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { UserModem } from '@/lib/models/UserModem'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { BalanceHistory } from '@/lib/models/BalanceHistory'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { classifySms, smsTypeLabel } from '@/lib/sms-classifier'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const resolvedParams = await params
    const userId = Number(resolvedParams.id) || resolvedParams.id

    const user = await User.findOne({ _id: userId, archivedAt: null }).select('-password').lean()
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    // Phase 1: queries that only need userId
    const [assignments, balanceHistories, userBalanceHistories, withdrawals] = await Promise.all([
      UserModem.find({ userId: user._id, removedAt: null, archivedAt: null }).lean(),
      BalanceHistory.find({ userId: user._id, archivedAt: null })
        .sort({ updatedAt: -1 }).limit(20).lean(),
      UserBalanceHistory.find({ userId: user._id, archivedAt: null })
        .sort({ updatedAt: -1 }).limit(50).lean(),
      WithdrawalRequest.find({ userId: user._id, archivedAt: null })
        .sort({ updatedAt: -1 }).lean(),
    ])

    // Phase 2: modem + sim queries (need modemIds from phase 1)
    const modemIds = assignments.map(a => a.modemId)
    const [modems, sims] = await Promise.all([
      Modem.find({ _id: { $in: modemIds }, archivedAt: null }).lean(),
      SimCard.find({ modemId: { $in: modemIds }, archivedAt: null }).lean(),
    ])
    const simMap = new Map(sims.map(s => [s.modemId, s]))
    const populatedAssignments = modems.map(m => ({
      modem: { ...m, _id: String(m._id) },
      sim: simMap.get(m._id) ?? null
    }))

    // Phase 3: SMS (needs simIds from phase 2)
    const simIds = sims.map(s => s._id)
    const smsRecords = await SmsRecord.find({ simCardId: { $in: simIds }, archivedAt: null })
      .sort({ receivedAt: -1 }).limit(50).lean()

    const smsWithTypes = smsRecords.map(sms => {
      const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
      return {
        ...sms,
        _id: String(sms._id),
        type,
        typeLabel: smsTypeLabel(type),
        isOffer: type === 'offer'
      }
    })

    return Response.json({
      user: { ...user, _id: String(user._id), balance: Number(user.balance) || 0 },
      assignments: populatedAssignments,
      balanceHistories: balanceHistories.map((b: { _id: { toString(): string }; balance?: number; previousBalance?: number }) => ({
        ...b,
        _id: String(b._id),
        balance: Number(b.balance) || 0,
        previousBalance: Number(b.previousBalance) || 0,
        delta: (Number(b.balance) || 0) - (Number(b.previousBalance) || 0)
      })),
      userBalanceHistories: userBalanceHistories.map(u => ({ ...u, _id: String(u._id), balance: Number(u.balance) || 0, amount: Number(u.amount) || 0 })),
      smsRecords: smsWithTypes,
      withdrawals: withdrawals.map(w => ({ ...w, _id: String(w._id), amount: Number(w.amount) || 0 }))
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
    const userId = Number(resolvedParams.id) || resolvedParams.id

    const body = await req.json().catch(() => ({}))
    const { action } = body

    if (action === 'archive') {
      const userObj = await User.findById(userId).lean()
      if (userObj) {
        if (String(session.user.id) === String(userId)) {
          return Response.json({ error: 'Cannot archive yourself' }, { status: 400 })
        }
        await User.updateOne({ _id: userId }, { $set: { archivedAt: new Date(), updatedAt: new Date() } })
        return Response.json({ ok: true })
      }
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'assign') {
      const { modemId } = body
      const parsedModemId = Number(modemId) || modemId

      if (!parsedModemId) {
        return Response.json({ error: 'Modem ID is required' }, { status: 400 })
      }

      const existing = await UserModem.findOne({ userId, modemId: parsedModemId, removedAt: null, archivedAt: null })
      if (existing) {
        return Response.json({ error: 'Modem is already assigned to this user' }, { status: 409 })
      }

      const modemObj = await Modem.findById(parsedModemId).lean()
      const machineId = modemObj?.machineId || '419c0cfc97666753'

      const lastAssignment = await UserModem.findOne().sort({ _id: -1 }).lean()
      const nextId = lastAssignment ? lastAssignment._id + 1 : 1

      await UserModem.create({
        _id: nextId,
        userId,
        modemId: parsedModemId,
        assignedAt: new Date(),
        machineId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      })

      return Response.json({ ok: true })
    }

    if (action === 'unassign') {
      const { modemId } = body
      const parsedModemId = Number(modemId) || modemId

      if (!parsedModemId) {
        return Response.json({ error: 'Modem ID is required' }, { status: 400 })
      }

      const userModem = await UserModem.findOne({ userId, modemId: parsedModemId, removedAt: null, archivedAt: null })
      if (userModem) {
        userModem.removedAt = new Date()
        userModem.updatedAt = new Date()
        await userModem.save()
        return Response.json({ ok: true })
      }
      return Response.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (action === 'edit') {
      const { displayName, password } = body
      const userObj = await User.findById(userId)
      if (!userObj || userObj.archivedAt) {
        return Response.json({ error: 'User not found or archived' }, { status: 404 })
      }
      
      if (displayName !== undefined) userObj.displayName = displayName
      if (password) userObj.password = password
      userObj.updatedAt = new Date()
      await userObj.save()
      
      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
