import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { User } from '@/lib/models/User'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { BalanceHistory } from '@/lib/models/BalanceHistory'
import { nextId } from '@/lib/id-generator'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const user = await User.findById(request.userId)
    if (!user || user.archivedAt !== null) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const adminId = Number(session.user.id)

    if (action === 'approve') {
      if (user.balance < request.amount) {
        return Response.json({ error: 'Insufficient user balance' }, { status: 400 })
      }

      request.status = 1
      request.processedAt = now
      request.processedByAdminId = adminId
      request.adminNote = note || null
      request.updatedAt = now
      await request.save()

      user.balance -= request.amount
      user.updatedAt = now
      await user.save()

      await UserBalanceHistory.create({
        _id: nextId(),
        userId: user._id,
        amount: -request.amount,
        balanceAfter: user.balance,
        type: 1,
        note: note || request.note || 'Withdrawal approved',
        recordedAt: now,
        updatedAt: now,
        machineId: request.machineId || user.machineId
      })

      await BalanceHistory.create({
        _id: nextId(),
        userId: user._id,
        simCardId: null,
        modemId: null,
        balance: Number(user.balance),
        previousBalance: Number(user.balance) + Number(request.amount),
        source: 4,
        recordedAt: now,
        updatedAt: now,
        archivedAt: null,
        machineId: request.machineId || user.machineId
      })

    } else if (action === 'reject') {
      request.status = 2
      request.processedAt = now
      request.processedByAdminId = adminId
      request.adminNote = note || null
      request.updatedAt = now
      await request.save()
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
