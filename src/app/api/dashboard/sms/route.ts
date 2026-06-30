import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { classifySms, smsTypeLabel } from '@/lib/sms-classifier'

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

    const sims = await SimCard.find({ modemId: { $in: modemIds }, archivedAt: null }).lean()
    const simIds = sims.map(s => s._id)

    const records = await SmsRecord.find({
      simCardId: { $in: simIds },
      senderNumber: { $regex: /mobilis/i },
      archivedAt: null,
    }).sort({ receivedAt: -1 }).limit(50).lean()

    const formatted = records.map(sms => {
      const type = classifySms(sms.senderNumber ?? '', sms.content ?? '')
      return {
        id: String(sms._id),
        sender: sms.senderNumber,
        content: sms.content,
        receivedAt: sms.receivedAt,
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
