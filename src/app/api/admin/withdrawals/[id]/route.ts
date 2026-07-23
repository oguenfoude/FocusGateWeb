import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, note } = body

    if (action !== 'approve' && action !== 'reject') {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    await connectDB()

    // Use raw MongoDB collection to avoid Mongoose Number cast precision loss on large IDs
    const db = mongoose.connection.db!
    const col = db.collection('withdrawalrequests')

    // Try Number first (handles most IDs), then fall back to string match for oversized IDs
    const numId = Number(id)
    let request = await col.findOne({ _id: numId } as Record<string, unknown>)
    if (!request && id !== String(numId)) {
      // Oversized ID: precision was lost in Number conversion — try string-based matching
      request = await col.findOne({ _id: id } as Record<string, unknown>)
    }
    if (!request) {
      return Response.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (request.archivedAt !== null && request.archivedAt !== undefined) {
      return Response.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (request.status !== 0) {
      return Response.json({ error: 'Request is already processed' }, { status: 400 })
    }

    const now = new Date()
    const requestObjectId = request._id
    const adminId = body.adminId ? (Number(body.adminId) || body.adminId) : undefined

    if (action === 'approve') {
      const user = await User.findById(request.userId)
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      const oldBalance = toNum(user.balance)
      const withdrawalAmount = toNum(request.amount)
      const newBalance = Math.max(0, oldBalance - withdrawalAmount)

      const session = await mongoose.connection.startSession()
      try {
        await session.withTransaction(async () => {
          await col.updateOne(
            { _id: requestObjectId },
            { $set: { status: 1, processedAt: now, adminNote: note || 'Withdrawal approved', updatedAt: now, ...(adminId !== undefined ? { processedByAdminId: adminId } : {}) } },
            { session }
          )

          await User.updateOne(
            { _id: request.userId },
            { $set: { balance: newBalance, updatedAt: now } },
            { session }
          )

          const BalanceHistory = (await import('@/lib/models/BalanceHistory')).BalanceHistory
          await BalanceHistory.create(
            [{
              _id: nextId(),
              simCardId: null,
              modemId: null,
              userId: request.userId,
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
              userId: request.userId,
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

      return Response.json({ ok: true })
    }

    if (action === 'reject') {
      const session = await mongoose.connection.startSession()
      try {
        await session.withTransaction(async () => {
          await col.updateOne(
            { _id: requestObjectId },
            { $set: { status: 2, processedAt: now, adminNote: note || 'Withdrawal rejected', updatedAt: now, ...(adminId !== undefined ? { processedByAdminId: adminId } : {}) } },
            { session }
          )
        })
      } finally {
        await session.endSession()
      }

      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Withdrawal PATCH error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
