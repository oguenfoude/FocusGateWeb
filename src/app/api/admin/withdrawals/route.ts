import { connectDB } from '@/lib/mongodb'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import '@/lib/models/User' // required for populate
import { toNum } from '@/lib/number-utils'

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
