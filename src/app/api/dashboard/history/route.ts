import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    await connectDB()

    const histories = await UserBalanceHistory.find({
      userId: Number(userId) || userId,
      archivedAt: null,
    }).sort({ updatedAt: -1 }).limit(100).lean()

    return Response.json(histories)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
