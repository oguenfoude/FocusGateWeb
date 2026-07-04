import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import '@/lib/models/User' // required for populate
import { toNum } from '@/lib/number-utils'
import { nextId } from '@/lib/id-generator'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()

    const all = await WithdrawalRequest.find({ archivedAt: null })
      .sort({ updatedAt: -1 })
      .populate('userId', 'username balance')
      .lean()

    const result = all.map(w => {
      const populated = w.userId as unknown as { _id: { toString(): string }; username: string; balance: unknown } | null
      return {
        ...w,
        _id: String(w._id),
        amount: toNum(w.amount),
        userId: populated ? {
          ...populated,
          _id: String(populated._id),
          balance: toNum(populated.balance),
        } : w.userId,
      }
    })

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const { userId, amount, note } = body

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    const amt = Number(amount)
    if (!amt || amt <= 0) {
      return Response.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    const User = (await import('@/lib/models/User')).User
    const user = await User.findById(userId)
    if (!user || user.archivedAt) {
      return Response.json({ error: 'User not found or archived' }, { status: 404 })
    }

    const userBalance = toNum(user.balance)
    if (amt > userBalance) {
      return Response.json({ error: 'Amount exceeds available balance' }, { status: 400 })
    }

    const existingPending = await WithdrawalRequest.findOne({
      userId,
      status: 0,
      archivedAt: null
    }).lean()
    if (existingPending) {
      return Response.json({ error: 'User already has a pending withdrawal request' }, { status: 409 })
    }

    const now = new Date()
    await WithdrawalRequest.create({
      _id: nextId(),
      userId,
      amount: amt,
      status: 0,
      note: note || null,
      adminNote: null,
      processedByAdminId: null,
      requestedAt: now,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      machineId: 'web',
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Withdrawal POST error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
