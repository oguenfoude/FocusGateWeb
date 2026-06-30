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
    const modems = await Modem.find({ _id: { $in: modemIds }, archivedAt: null }).lean()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

    const result = await Promise.all(modems.map(async m => {
      const sim = await SimCard.findOne({ modemId: m._id, isActive: true, archivedAt: null })
        .select('phoneNumber status lastSeen balance')
        .lean()
      return {
        modemId: String(m._id),
        imei: m.imei,
        brand: m.brand,
        model: m.model,
        isOnline: m.status === 4 && m.updatedAt && new Date(m.updatedAt) > fiveMinAgo,
        phoneNumber: sim?.phoneNumber ?? null,
        simStatus: sim?.status ?? null,
        lastSeen: sim?.lastSeen ?? null,
        balance: sim?.balance ?? 0,
      }
    }))

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
