import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { toNum } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'

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

    const histories = await UserBalanceHistory.find({
      userId: auth.userId,
      archivedAt: null,
    }).sort({ recordedAt: -1 }).limit(100).lean()

    return Response.json(histories.map(h => ({
      ...h,
      _id: String(h._id),
      amount: toNum(h.amount),
      balanceAfter: toNum(h.balanceAfter),
    })))
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
