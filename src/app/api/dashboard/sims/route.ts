import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'user') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const assignments = await UserModem.find({
      userId: session.user.id,
      removedAt: null,
      archivedAt: null,
    }).lean()

    const modemIds = assignments.map(a => a.modemId)
    const [modems, sims] = await Promise.all([
      Modem.find({ _id: { $in: modemIds }, archivedAt: null }).lean(),
      SimCard.find({ modemId: { $in: modemIds }, isActive: true, archivedAt: null })
        .select('modemId phoneNumber status lastSeen balance').lean(),
    ])

    const simMap = new Map(sims.map(s => [s.modemId, s]))
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000)

    const result = modems.map(m => {
      const sim = simMap.get(m._id) ?? null
      return {
        modemId: String(m._id),
        imei: m.imei,
        brand: m.brand,
        model: m.model,
        isOnline: m.status === 4 && m.updatedAt && new Date(m.updatedAt) > twoMinAgo,
        phoneNumber: sim?.phoneNumber ?? null,
        simStatus: sim?.status ?? null,
        lastSeen: sim?.lastSeen ?? null,
        balance: sim?.balance ?? 0,
      }
    })

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
