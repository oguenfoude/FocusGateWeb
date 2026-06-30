import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { UserModem } from '@/lib/models/UserModem'
import { User } from '@/lib/models/User'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { UserDashboardContent } from '@/components/dashboard/UserDashboardContent'

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData(userId: string | number) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

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
    updatedAt: { $gte: fiveMinutesAgo }
  })

  const user = await User.findOne({ _id: userId }).lean()
  const balance = user?.balance || 0

  const walletHistories = await UserBalanceHistory.find({
    userId,
    type: 0,
    archivedAt: null
  }).lean()
  const totalCredits = walletHistories.reduce((sum, h) => sum + (h.amount ?? 0), 0)

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
    .populate({
      path: 'simCardId',
      populate: {
        path: 'modemId',
        model: 'Modem'
      }
    })
    .lean()

  const recentSms = recentSmsRaw.map(sms => {
    const sc = sms.simCardId as Record<string, unknown> | null | undefined
    const modem = sc?.modemId as Record<string, unknown> | null | undefined
    return {
      _id: String(sms._id),
      receivedAt: sms.receivedAt instanceof Date ? sms.receivedAt.toISOString() : String(sms.receivedAt ?? ''),
      senderNumber: sms.senderNumber as string | undefined,
      content: sms.content as string | undefined,
      simCardId: sc ? {
        phoneNumber: sc.phoneNumber as string | undefined,
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

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  await connectDB()

  const userId = Number(session.user.id) || session.user.id
  const data = await getDashboardData(userId)

  return <UserDashboardContent data={data} />
}
