import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  userId: z.union([z.number(), z.string()]),
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(Number(userId) || userId).lean()
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const pending = await WithdrawalRequest.findOne({
      userId: Number(userId) || userId,
      status: 0,
      archivedAt: null
    }).lean()

    return Response.json({
      balance: toNum(user.balance),
      hasPending: !!pending,
      pendingAmount: toNum(pending?.amount)
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const { userId, amount, note } = parsed.data

    await connectDB()

    const now = new Date()

    const user = await User.findById(Number(userId) || userId).lean()
    if (!user || user.archivedAt) {
      return Response.json({ error: 'User not found or archived' }, { status: 404 })
    }

    const userBalance = toNum(user.balance)
    if (amount > userBalance) {
      return Response.json({ error: 'Amount exceeds available balance' }, { status: 400 })
    }

    const pending = await WithdrawalRequest.findOne({
      userId: Number(userId) || userId,
      status: 0,
      archivedAt: null
    }).lean()

    if (pending) {
      return Response.json({ error: 'You already have a pending withdrawal request.' }, { status: 409 })
    }

    await WithdrawalRequest.create({
      _id: nextId(),
      userId: Number(userId) || userId,
      amount,
      note: note || null,
      status: 0,
      requestedAt: now,
      machineId: 'web',
      createdAt: now,
      updatedAt: now,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
