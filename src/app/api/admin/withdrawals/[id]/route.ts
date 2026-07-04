import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'

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

    const request = await WithdrawalRequest.findById(id)
    if (!request || request.archivedAt !== null) {
      return Response.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (request.status !== 0) {
      return Response.json({ error: 'Request is already processed' }, { status: 400 })
    }

    const now = new Date()

    if (action === 'approve') {
      const user = await User.findById(request.userId)
      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 })
      }

      const oldBalance = toNum(user.balance)
      const withdrawalAmount = toNum(request.amount)
      const newBalance = Math.max(0, oldBalance - withdrawalAmount)

      await WithdrawalRequest.updateOne(
        { _id: request._id },
        { $set: { status: 1, processedAt: now, adminNote: note || 'Withdrawal approved', updatedAt: now } }
      )

      await User.updateOne(
        { _id: request.userId },
        { $set: { balance: newBalance, updatedAt: now } }
      )

      const BalanceHistory = (await import('@/lib/models/BalanceHistory')).BalanceHistory
      await BalanceHistory.create({
        _id: nextId(),
        simCardId: null,
        modemId: null,
        userId: request.userId,
        balance: newBalance,
        previousBalance: oldBalance,
        source: 3,
        recordedAt: now,
        updatedAt: now,
        archivedAt: null,
        machineId: 'web',
      })

      const UserBalanceHistory = (await import('@/lib/models/UserBalanceHistory')).UserBalanceHistory
      await UserBalanceHistory.create({
        _id: nextId(),
        userId: request.userId,
        amount: -withdrawalAmount,
        balanceAfter: newBalance,
        type: 1,
        simCardId: null,
        note: note || 'Withdrawal approved',
        recordedAt: now,
        updatedAt: now,
        archivedAt: null,
        machineId: 'web',
      })

      return Response.json({ ok: true })
    }

    if (action === 'reject') {
      await WithdrawalRequest.updateOne(
        { _id: request._id },
        { $set: { status: 2, processedAt: now, adminNote: note || 'Withdrawal rejected', updatedAt: now } }
      )

      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
