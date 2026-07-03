import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { SimCard } from '@/lib/models/SimCard'
import { classifySms, smsTypeLabel } from '@/lib/sms-classifier'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const modemId = searchParams.get('modemId')
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 365)

    await connectDB()

    const since = new Date(Date.now() - days * 86400_000)

    const filter: Record<string, unknown> = {
      receivedAt: { $gte: since },
      archivedAt: null,
    }

    if (modemId && modemId !== 'all') {
      const sims = await SimCard.find({ modemId: Number(modemId) || modemId, archivedAt: null }).lean()
      filter.simCardId = { $in: sims.map(s => s._id) }
    }

    const records = await SmsRecord.find(filter)
      .sort({ receivedAt: -1 })
      .limit(200)
      .lean()

    const simIds = [...new Set(records.map(r => String(r.simCardId)))]
    const sims = await SimCard.find({ _id: { $in: simIds } }).lean()
    const simToModem = new Map(sims.map(s => [String(s._id), String(s.modemId)]))

    const formatted = records.map(sms => {
      const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
      return {
        ...sms,
        _id: String(sms._id),
        sender: sms.senderNumber,
        modemId: simToModem.get(String(sms.simCardId)) || null,
        type,
        typeLabel: smsTypeLabel(type),
        isOffer: type === 'offer'
      }
    })

    return Response.json(formatted)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
