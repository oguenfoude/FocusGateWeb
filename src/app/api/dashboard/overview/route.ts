import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { User } from '@/lib/models/User'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { toNum } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await connectDB()

    const numericUserId = Number(userId) || userId

    const assignments = await UserModem.find({
      userId: numericUserId,
      removedAt: null,
      archivedAt: null
    }).lean()
    const modemIds = assignments.map(a => a.modemId)

    const totalModems = modemIds.length
    const onlineModems = modemIds.length > 0
      ? await Modem.countDocuments({ _id: { $in: modemIds }, status: 4 })
      : 0

    const user = await User.findOne({ _id: numericUserId }).lean()
    const balance = toNum(user?.balance)

    const creditAggr = await UserBalanceHistory.aggregate([
      { $match: { userId: numericUserId, type: 0, archivedAt: null } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const totalCredits = creditAggr.length > 0 ? toNum(creditAggr[0].total) : 0

    const pendingRequest = await WithdrawalRequest.findOne({
      userId: numericUserId,
      status: 0,
      archivedAt: null
    }).lean()
    const pendingAmount = toNum(pendingRequest?.amount)

    const activeSims = await SimCard.find({
      modemId: { $in: modemIds },
      isActive: true,
      archivedAt: null
    }).lean()
    const simCardIds = activeSims.map(s => s._id)

    const recentSmsRaw = await SmsRecord.find({
      simCardId: { $in: simCardIds },
      senderNumber: { $regex: /mobilis/i },
      archivedAt: null
    })
      .sort({ receivedAt: -1 })
      .limit(20)
      .lean()

    const simLookupMap = new Map(activeSims.map(s => [String(s._id), s]))
    const modemLookupIds = [...new Set(activeSims.map(s => s.modemId))]
    const modemLookupDocs = modemLookupIds.length > 0
      ? await Modem.find({ _id: { $in: modemLookupIds } }).select('imei').lean()
      : []
    const modemLookupMap = new Map(modemLookupDocs.map(m => [String(m._id), m]))

    const recentSms = recentSmsRaw.map(sms => {
      const sc = simLookupMap.get(String(sms.simCardId))
      const modem = sc ? modemLookupMap.get(String(sc.modemId)) : null
      return {
        _id: String(sms._id),
        receivedAt: sms.receivedAt instanceof Date ? sms.receivedAt.toISOString() : String(sms.receivedAt ?? ''),
        senderNumber: sms.senderNumber as string | undefined,
        content: sms.content as string | undefined,
        simCardId: sc ? {
          phoneNumber: Number(sc.phoneNumber) || undefined,
          modemId: modem ? { imei: modem.imei as string | undefined } : undefined,
        } : undefined,
      }
    })

    return NextResponse.json({
      totalModems,
      onlineModems,
      balance,
      totalCredits,
      pendingAmount,
      recentSms,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
