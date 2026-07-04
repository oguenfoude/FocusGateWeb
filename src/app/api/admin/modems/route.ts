import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { User } from '@/lib/models/User'
import { toNum } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'

function stripComPort(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj }
  delete result.comPort
  return result
}

export async function GET() {
  try {
    await connectDB()

    const [modems, sims, userModems, users] = await Promise.all([
      Modem.find({ archivedAt: null }).lean(),
      SimCard.find({ isActive: true, archivedAt: null }).lean(),
      UserModem.find({ removedAt: null, archivedAt: null }).lean(),
      User.find({ archivedAt: null }).select('username').lean(),
    ])

    const simMap = new Map(sims.map(s => [s.modemId, s]))
    const userMap = new Map(users.map(u => [u._id, u.username]))
    const assignMap = new Map(userModems.map(um => [um.modemId, userMap.get(um.userId) ?? null]))

    const populated = modems.map(m => {
      const rawBalance = simMap.get(m._id)?.balance;
      return {
        ...stripComPort(m),
        _id: String(m._id),
        isOnline: m.status === 4,
        phoneNumber: simMap.get(m._id)?.phoneNumber ?? null,
        balance: toNum(rawBalance),
        simLastSeen: simMap.get(m._id)?.lastSeen ?? null,
        assignedTo: assignMap.get(m._id) ?? null,
      }
    })

    return Response.json(populated)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
