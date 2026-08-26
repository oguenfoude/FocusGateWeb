import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  try {
    if (!checkRateLimit(req, 'dashboard', 60, 60_000)) {
      return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    let auth
    try {
      auth = await requireAuth(req)
    } catch (e) {
      if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status })
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(auth.userId).lean()
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const pending = await WithdrawalRequest.findOne({
      userId: auth.userId,
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
    if (!checkRateLimit(req, 'dashboard', 60, 60_000)) {
      return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    let auth
    try {
      auth = await requireAuth(req)
    } catch (e) {
      if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status })
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
    const numericUserId = auth.userId

    const user = await User.findOne({ _id: numericUserId, archivedAt: null }).select('archivedAt balance').lean()
    if (!user) {
      return Response.json({ error: 'User not found or archived' }, { status: 404 })
    }

    const userBalance = toNum(user.balance)
    if (amount > userBalance) {
      return Response.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    try {
      await WithdrawalRequest.create({
        _id: nextId(),
        userId: numericUserId,
        amount,
        note: note || null,
        status: 0,
        requestedAt: now,
        machineId: 'web',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('E11000') || msg.includes('already exists') || msg.includes('duplicate key')) {
        return Response.json({ error: 'You already have a pending withdrawal request.' }, { status: 409 })
      }
      throw err
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
