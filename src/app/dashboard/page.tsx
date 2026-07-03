import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { User } from '@/lib/models/User'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { UserDashboardContent } from '@/components/dashboard/UserDashboardContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData(userId: string | number) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

  const assignments = await UserModem.find({
    userId,
    removedAt: null,
    archivedAt: null
  }).lean()
  const modemIds = assignments.map(a => a.modemId)

  const totalModems = modemIds.length
  const onlineModems = await Modem.countDocuments({
    _id: { $in: modemIds },
    status: 4,
    updatedAt: { $gte: tenMinutesAgo }
  })

  const user = await User.findOne({ _id: userId }).lean()
  const balance = user?.balance || 0

  const creditAggr = await UserBalanceHistory.aggregate([
    { $match: { userId: userId, type: 0, archivedAt: null } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  const totalCredits = creditAggr.length > 0 ? Number(creditAggr[0].total) : 0

  const pendingRequest = await WithdrawalRequest.findOne({
    userId,
    status: 0,
    archivedAt: null
  }).lean()
  const pendingAmount = pendingRequest?.amount || 0

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

  return {
    totalModems,
    onlineModems,
    balance,
    totalCredits,
    pendingAmount,
    recentSms,
  }
}

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const userId = params.userId ? (Array.isArray(params.userId) ? params.userId[0] : params.userId) : null

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-sm">No user ID provided.</p>
          <p className="text-gray-400 text-xs">Append <code>?userId=1</code> to the URL.</p>
        </div>
      </div>
    )
  }

  await connectDB()

  const numericUserId = Number(userId) || userId
  const data = await getDashboardData(numericUserId)

  return <UserDashboardContent data={data} userId={String(numericUserId)} />
}
