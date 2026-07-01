import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id).lean()
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const pending = await WithdrawalRequest.findOne({ 
      userId: session.user.id, 
      status: 0,
      archivedAt: null 
    }).lean()

    return Response.json({
      balance: Number(user.balance) || 0,
      hasPending: !!pending,
      pendingAmount: Number(pending?.amount) || 0
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const { amount, note } = parsed.data

    await connectDB()

    const now = new Date()

    const atomicCheck = await User.findOneAndUpdate(
      { _id: session.user.id, balance: { $gte: amount }, archivedAt: null },
      { $set: { updatedAt: now } },
      { new: false }
    ).lean()

    if (!atomicCheck) {
      return Response.json({ error: 'Amount exceeds available balance' }, { status: 400 })
    }

    const pending = await WithdrawalRequest.findOne({ 
      userId: session.user.id, 
      status: 0,
      archivedAt: null
    }).lean()
    
    if (pending) {
      return Response.json({ error: 'You already have a pending withdrawal request.' }, { status: 409 })
    }

    await WithdrawalRequest.create({
      _id: nextId(),
      userId: session.user.id,
      amount,
      note: note || null,
      status: 0,
      requestedAt: now,
      machineId: atomicCheck.machineId || '',
      createdAt: now,
      updatedAt: now,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
