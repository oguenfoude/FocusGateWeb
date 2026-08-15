import { connectDB } from '@/lib/mongodb'
import { Modem } from '@/lib/models/Modem'
import { SimCard } from '@/lib/models/SimCard'
import { User } from '@/lib/models/User'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { SmsRecord } from '@/lib/models/SmsRecord'
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent'
import { toNum } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData() {
  const simFilter = { isActive: true, archivedAt: null, $or: [{ phoneNumber: { $gt: 0 } }, { balance: { $gt: 0 } }] }
  const [modemsTotal, modemsOnline, simCount, simBalanceAllAggr, userCount, userBalanceAggr, pendingWithdrawals, recentSmsRaw] = await Promise.all([
    Modem.countDocuments({ archivedAt: null }),
    Modem.countDocuments({ status: 4, archivedAt: null }),
    SimCard.countDocuments(simFilter),
    SimCard.aggregate([
      { $match: simFilter },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),
    User.countDocuments({ role: { $ne: 0 }, archivedAt: null }),
    User.aggregate([{ $match: { role: { $ne: 0 }, archivedAt: null } }, { $group: { _id: null, total: { $sum: '$balance' } } }]),
    WithdrawalRequest.countDocuments({ status: 0, archivedAt: null }),
    SmsRecord.find({ archivedAt: null }).sort({ receivedAt: -1 }).limit(20).lean(),
  ])

  const totalSimBalance = simBalanceAllAggr.length > 0 ? toNum(simBalanceAllAggr[0].total) : 0
  const totalUserBalance = userBalanceAggr.length > 0 ? toNum(userBalanceAggr[0].total) : 0

  const simIds = [...new Set(recentSmsRaw.map(s => s.simCardId))]
  const sims = simIds.length > 0 ? await SimCard.find({ _id: { $in: simIds } }).lean() : []
  const simMap = new Map(sims.map(s => [String(s._id), s]))

  const modemIds = [...new Set(sims.map(s => s.modemId))]
  const modems = modemIds.length > 0 ? await Modem.find({ _id: { $in: modemIds } }).lean() : []
  const modemMap = new Map(modems.map(m => [String(m._id), m]))

  const recentSms = recentSmsRaw.map(sms => {
    const sim = simMap.get(String(sms.simCardId))
    const modem = sim ? modemMap.get(String(sim.modemId)) : null
    return {
      _id: String(sms._id),
      senderNumber: sms.senderNumber,
      content: sms.content,
      receivedAt: sms.receivedAt instanceof Date ? sms.receivedAt.toISOString() : String(sms.receivedAt),
      simPhoneNumber: sim?.phoneNumber ?? null,
      modemImei: modem?.imei ?? null,
    }
  })

  return {
    modemsTotal,
    modemsOnline,
    simCount,
    totalSimBalance,
    userCount,
    totalUserBalance,
    pendingWithdrawals,
    recentSms,
  }
}

export default async function AdminDashboardPage() {
  await connectDB()
  const data = await getDashboardData()

  return <AdminDashboardContent data={data} />
}
