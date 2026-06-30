import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import '@/lib/models/User' // required for populate

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const all = await WithdrawalRequest.find({ archivedAt: null })
      .sort({ updatedAt: -1 })
      .populate('userId', 'username balance')
      .lean()

    const result = all.map(w => {
      const populated = w.userId as unknown as { _id: { toString(): string }; username: string; balance: number } | null
      return {
        ...w,
        _id: String(w._id),
        amount: Number(w.amount) || 0,
        userId: populated ? {
          ...populated,
          _id: String(populated._id),
          balance: Number(populated.balance) || 0,
        } : w.userId,
      }
    })

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
