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
      const updateResult = await User.updateOne(
        { _id: request.userId, balance: { $gte: request.amount } },
        { $inc: { balance: -request.amount }, $set: { updatedAt: now } }
      )
      if (updateResult.modifiedCount === 0) {
        return Response.json({ error: 'Insufficient user balance' }, { status: 400 })
      }

      const updatedUser = await User.findById(request.userId).lean()
      const newBalance = Number(updatedUser?.balance ?? 0)

      request.status = 1
      request.processedAt = now
      request.processedByAdminId = adminId
      request.adminNote = note || null
      request.updatedAt = now
      await request.save()

      await UserBalanceHistory.create({
        _id: nextId(),
        userId: request.userId,
        amount: -request.amount,
        balanceAfter: newBalance,
        type: 1,
        note: note || request.note || 'Withdrawal approved',
        recordedAt: now,
        updatedAt: now,
        machineId: request.machineId || ''
      })

      await BalanceHistory.create({
        _id: nextId(),
        userId: request.userId,
        simCardId: null,
        modemId: null,
        balance: newBalance,
        previousBalance: newBalance + Number(request.amount),
        source: 4,
        recordedAt: now,
        updatedAt: now,
        archivedAt: null,
        machineId: request.machineId || ''
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
