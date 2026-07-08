import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { classifySms, smsTypeLabel } from '@/lib/sms-classifier'

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

    const sims = await SimCard.find({ modemId: { $in: modemIds }, isActive: true, archivedAt: null }).lean()
    const simIds = sims.map(s => s._id)

    const records = await SmsRecord.find({
      simCardId: { $in: simIds },
      senderNumber: { $regex: /mobilis|610/i },
      archivedAt: null,
    }).sort({ receivedAt: -1 }).limit(50).lean()

    const simMap = new Map(sims.map(s => [String(s._id), s]))

    const formatted = records.map(sms => {
      const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
      const sim = simMap.get(String(sms.simCardId))
      return {
        id: String(sms._id),
        sender: sms.senderNumber,
        content: sms.content,
        receivedAt: sms.receivedAt,
        type,
        typeLabel: smsTypeLabel(type),
        isOffer: type === 'offer',
        simPhoneNumber: sim?.phoneNumber ?? null,
      }
    })

    return Response.json(formatted)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
