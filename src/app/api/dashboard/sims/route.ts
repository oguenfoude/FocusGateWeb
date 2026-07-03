import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    await connectDB()

    const assignments = await UserModem.find({
      userId: Number(userId) || userId,
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
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)

    const result = modems.map(m => {
      const sim = simMap.get(m._id) ?? null
      return {
        modemId: String(m._id),
        imei: m.imei,
        brand: m.brand,
        model: m.model,
        isOnline: m.status === 4 && m.updatedAt && new Date(m.updatedAt) > tenMinAgo,
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
