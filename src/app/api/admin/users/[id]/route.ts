import { NextRequest } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum, toNumOrNull } from '@/lib/number-utils'
import { requireAdmin, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

async function findUserByLegacySafeId(id: string) {
  const numId = Number(id)
  let user = await User.findOne({ _id: numId, archivedAt: null }).select('-password').lean()
  if (!user && id !== String(numId)) {
    const col = mongoose.connection.db!.collection('users')
    const raw = await col.findOne({ _id: id } as Record<string, unknown>)
    if (raw && (raw.archivedAt === null || raw.archivedAt === undefined)) {
      delete (raw as Record<string, unknown>).password
      user = raw as Awaited<typeof user>
    }
  }
  return user
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

    const user = await findUserByLegacySafeId(resolvedParams.id)
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    const UserModem = (await import('@/lib/models/UserModem')).UserModem
    const Modem = (await import('@/lib/models/Modem')).Modem
    const SimCard = (await import('@/lib/models/SimCard')).SimCard
    const BalanceHistory = (await import('@/lib/models/BalanceHistory')).BalanceHistory
    const SmsRecord = (await import('@/lib/models/SmsRecord')).SmsRecord
    const WithdrawalRequest = (await import('@/lib/models/WithdrawalRequest')).WithdrawalRequest
    const UserBalanceHistory = (await import('@/lib/models/UserBalanceHistory')).UserBalanceHistory
    const { classifySms, smsTypeLabel } = await import('@/lib/sms-classifier')

    const [assignments, userBalanceHistories, withdrawals] = await Promise.all([
      UserModem.find({ userId: user._id, removedAt: null, archivedAt: null }).lean(),
      UserBalanceHistory.find({ userId: user._id, archivedAt: null })
        .sort({ recordedAt: -1 }).limit(50).lean(),
      WithdrawalRequest.find({ userId: user._id, archivedAt: null })
        .sort({ updatedAt: -1 }).lean(),
    ])

    const modemIds = assignments.map(a => a.modemId)
    const [modems, sims] = await Promise.all([
      Modem.find({ _id: { $in: modemIds }, archivedAt: null }).lean(),
      SimCard.find({ modemId: { $in: modemIds }, archivedAt: null }).lean(),
    ])
    const simMap = new Map(sims.map(s => [s.modemId, s]))
    const populatedAssignments = modems.map(m => {
      const modemData = { ...m }
      delete modemData.comPort
      return {
        modem: { ...modemData, _id: String(m._id), imei: (m as any).iMEI || m.imei },
        sim: simMap.get(m._id) ?? null
      }
    })

    const simIds = sims.map(s => s._id)

    const balanceHistories = simIds.length > 0
      ? await BalanceHistory.find({ simCardId: { $in: simIds }, archivedAt: null })
          .sort({ recordedAt: -1 }).limit(20).lean()
      : []

    const smsRecords = await SmsRecord.find({ simCardId: { $in: simIds }, archivedAt: null })
      .sort({ receivedAt: -1 }).limit(50).lean()

    const smsWithTypes = smsRecords.map(sms => {
      const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
      return {
        ...sms,
        _id: String(sms._id),
        sender: sms.senderNumber,
        type,
        typeLabel: smsTypeLabel(type),
        isOffer: type === 'offer'
      }
    })

    return Response.json({
      user: { ...user, _id: String(user._id), balance: toNum(user.balance) },
      assignments: populatedAssignments,
      balanceHistories: balanceHistories.map((b: { _id: { toString(): string }; balance?: unknown; previousBalance?: unknown }) => {
        const bal = toNum(b.balance)
        const prevBal = toNumOrNull(b.previousBalance)
        return {
          ...b,
          _id: String(b._id),
          balance: bal,
          previousBalance: prevBal,
          delta: prevBal != null ? bal - prevBal : bal,
        }
      }),
      userBalanceHistories: userBalanceHistories.map(u => ({ ...u, _id: String(u._id), balance: toNum(u.balanceAfter), amount: toNum(u.amount) })),
      smsRecords: smsWithTypes,
      withdrawals: withdrawals.map(w => ({ ...w, _id: String(w._id), amount: toNum(w.amount) }))
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
    const userId = Number(resolvedParams.id) || resolvedParams.id

    const body = await req.json().catch(() => ({}))
    const { action } = body

    if (action === 'archive') {
      const userObj = await User.findById(userId).lean()
      if (userObj) {
        await User.updateOne({ _id: userId }, { $set: { archivedAt: new Date(), updatedAt: new Date() } })
        return Response.json({ ok: true })
      }
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'restore') {
      const userObj = await User.findById(userId).lean()
      if (userObj) {
        await User.updateOne({ _id: userId }, { $set: { archivedAt: null, updatedAt: new Date() } })
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

      const UserModem = (await import('@/lib/models/UserModem')).UserModem

      // Check active assignment for this user
      const active = await UserModem.findOne({ userId, modemId: parsedModemId, removedAt: null, archivedAt: null })
      if (active) {
        return Response.json({ error: 'Modem is already assigned to this user' }, { status: 409 })
      }

      // Check if modem is actively assigned to a DIFFERENT user
      const otherUser = await UserModem.findOne({ modemId: parsedModemId, removedAt: null, archivedAt: null, userId: { $ne: userId } })
      if (otherUser) {
        return Response.json({ error: 'Modem is already assigned to another user' }, { status: 409 })
      }

      // Reactivate soft-deleted record (mirrors .NET IgnoreQueryFilters logic)
      const deleted = await UserModem.findOne({ userId, modemId: parsedModemId, archivedAt: null, removedAt: { $ne: null } })
      if (deleted) {
        await UserModem.updateOne(
          { _id: deleted._id },
          { $set: { removedAt: null, updatedAt: new Date() } }
        )
        return Response.json({ ok: true })
      }

      const now = new Date()
      await UserModem.create({
        _id: nextId(),
        userId,
        modemId: parsedModemId,
        assignedAt: now,
        removedAt: null,
        machineId: 'web',
        createdAt: now,
        updatedAt: now,
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

      const UserModem = (await import('@/lib/models/UserModem')).UserModem
      const userModem = await UserModem.findOne({ userId, modemId: parsedModemId, removedAt: null, archivedAt: null })
      if (!userModem) {
        return Response.json({ error: 'Assignment not found' }, { status: 404 })
      }

      await UserModem.updateOne(
        { _id: userModem._id },
        { $set: { removedAt: new Date(), updatedAt: new Date() } }
      )

      return Response.json({ ok: true })
    }

    if (action === 'edit') {
      const { displayName, password, currentPassword, username } = body
      const userObj = await User.findById(userId)
      if (!userObj || userObj.archivedAt) {
        return Response.json({ error: 'User not found or archived' }, { status: 404 })
      }
      
      if (username !== undefined) {
        const trimmed = String(username).trim()
        if (!trimmed) {
          return Response.json({ error: 'Username cannot be empty' }, { status: 400 })
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
          return Response.json({ error: 'Username may only contain letters, numbers, underscore, dot, or dash' }, { status: 400 })
        }
        const existing = await User.findOne({ username: trimmed, _id: { $ne: userId } }).lean()
        if (existing) {
          return Response.json({ error: 'Username already exists' }, { status: 409 })
        }
        userObj.username = trimmed
      }

      if (displayName !== undefined) userObj.displayName = displayName
      if (password) {
        if (currentPassword && userObj.password !== currentPassword) {
          return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
        userObj.password = password
      }
      userObj.updatedAt = new Date()
      await userObj.save()
      
      return Response.json({ ok: true })
    }

    if (action === 'credit') {
      const { amount, note } = body
      const creditAmount = Number(amount)
      const MAX_CREDIT_ABS = 1_000_000

      if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
        return Response.json({ error: 'Amount must be a positive finite number' }, { status: 400 })
      }
      if (creditAmount > MAX_CREDIT_ABS) {
        return Response.json({ error: `Amount exceeds maximum (${MAX_CREDIT_ABS})` }, { status: 400 })
      }

      const userObj = await User.findById(userId).select('archivedAt').lean()
      if (!userObj || userObj.archivedAt) {
        return Response.json({ error: 'User not found or archived' }, { status: 404 })
      }

      const now = new Date()
      const updated = await User.findOneAndUpdate(
        { _id: userId, archivedAt: null },
        { $inc: { balance: creditAmount }, $set: { updatedAt: now, balanceUpdatedAt: now } },
        { new: true }
      )
      if (!updated) {
        return Response.json({ error: 'User not found or archived' }, { status: 404 })
      }

      const UserBalanceHistory = (await import('@/lib/models/UserBalanceHistory')).UserBalanceHistory
      await UserBalanceHistory.create({
        _id: nextId(),
        userId,
        amount: creditAmount,
        balanceAfter: toNum(updated.balance),
        type: 0,
        note: note || 'Admin credit',
        simCardId: null,
        recordedAt: now,
        updatedAt: now,
        machineId: 'web',
        archivedAt: null,
      })

      return Response.json({ ok: true, balance: toNum(updated.balance) })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
