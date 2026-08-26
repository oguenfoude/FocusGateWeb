import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'
import mongoose from 'mongoose'
import { requireAdmin, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const body = await req.json()
    const { action, note } = body

    if (action !== 'approve' && action !== 'reject') {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    await connectDB()

    const db = mongoose.connection.db!
    const col = db.collection('withdrawalrequests')

    const numId = Number(id)
    if (!Number.isFinite(numId) || numId <= 0) {
      return Response.json({ error: 'Invalid withdrawal ID' }, { status: 400 })
    }
    const now = new Date()
    const adminId = body.adminId ? (Number(body.adminId) || body.adminId) : undefined

    if (action === 'approve') {
      const session = await mongoose.connection.startSession()
      let approvedDoc: Record<string, unknown> | null = null
      try {
        await session.withTransaction(async () => {
          approvedDoc = await col.findOneAndUpdate(
            { _id: numId, status: 0, archivedAt: null } as Record<string, unknown>,
            { $set: { status: 1, processedAt: now, adminNote: note || 'Withdrawal approved', updatedAt: now, ...(adminId !== undefined ? { processedByAdminId: adminId } : {}) } },
            { returnDocument: 'after', session }
          )

          if (!approvedDoc) return

          const user = await User.findById(approvedDoc.userId).session(session)
          if (!user) return

          const oldBalance = toNum(user.balance)
          const withdrawalAmount = toNum(approvedDoc.amount)
          const newBalance = Math.max(0, oldBalance - withdrawalAmount)

          await User.updateOne(
            { _id: approvedDoc.userId },
            { $set: { balance: newBalance, updatedAt: now, balanceUpdatedAt: now } },
            { session }
          )

          const BalanceHistory = (await import('@/lib/models/BalanceHistory')).BalanceHistory
          await BalanceHistory.create(
            [{
              _id: nextId(),
              simCardId: null,
              modemId: null,
              userId: approvedDoc.userId,
              balance: newBalance,
              previousBalance: oldBalance,
              source: 4,
              recordedAt: now,
              updatedAt: now,
              archivedAt: null,
              machineId: 'web',
            }],
            { session }
          )

          const UserBalanceHistory = (await import('@/lib/models/UserBalanceHistory')).UserBalanceHistory
          await UserBalanceHistory.create(
            [{
              _id: nextId(),
              userId: approvedDoc.userId,
              amount: -withdrawalAmount,
              balanceAfter: newBalance,
              type: 1,
              simCardId: null,
              note: note || `Withdrawal approved (${withdrawalAmount.toLocaleString()} DA)`,
              recordedAt: now,
              updatedAt: now,
              archivedAt: null,
              machineId: 'web',
            }],
            { session }
          )
        })
      } finally {
        await session.endSession()
      }

      if (!approvedDoc) {
        return Response.json({ ok: true, message: 'Already processed' })
      }

      return Response.json({ ok: true })
    }

    if (action === 'reject') {
      const session = await mongoose.connection.startSession()
      let rejectedDoc: Record<string, unknown> | null = null
      try {
        await session.withTransaction(async () => {
          rejectedDoc = await col.findOneAndUpdate(
            { _id: numId, status: 0, archivedAt: null } as Record<string, unknown>,
            { $set: { status: 2, processedAt: now, adminNote: note || 'Withdrawal rejected', updatedAt: now, ...(adminId !== undefined ? { processedByAdminId: adminId } : {}) } },
            { returnDocument: 'after', session }
          )
        })
      } finally {
        await session.endSession()
      }

      if (!rejectedDoc) {
        return Response.json({ ok: true, message: 'Already processed' })
      }

      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Withdrawal PATCH error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
