import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, AuthError } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
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

    const assignments = await UserModem.find({
      userId: auth.userId,
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

    const result = modems.map(m => {
      const sim = simMap.get(m._id) ?? null
      return {
        modemId: String(m._id),
        imei: (m as any).iMEI || m.imei,
        brand: m.brand,
        model: m.model,
        isOnline: m.status === 4,
        phoneNumber: sim?.phoneNumber ?? null,
        simStatus: sim?.status ?? null,
        lastSeen: sim?.lastSeen ?? null,
        balance: toNum(sim?.balance),
      }
    })

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
