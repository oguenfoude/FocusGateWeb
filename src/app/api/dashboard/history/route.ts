import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const userId = Number(session.user.id) || session.user.id

    const histories = await UserBalanceHistory.find({
      userId,
      archivedAt: null,
    }).sort({ updatedAt: -1 }).limit(100).lean()

    return Response.json(histories)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
