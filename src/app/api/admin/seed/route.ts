import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { UserModem } from '@/lib/models/UserModem'
import { Modem } from '@/lib/models/Modem'
import { WithdrawalRequest } from '@/lib/models/WithdrawalRequest'
import { UserBalanceHistory } from '@/lib/models/UserBalanceHistory'
import { nextId } from '@/lib/id-generator'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await connectDB()

    const existingUsers = await User.countDocuments({ role: 1, archivedAt: null })
    if (existingUsers >= 3) {
      return Response.json({ ok: true, message: 'Test data already seeded', skipped: true })
    }

    const modems = await Modem.find({ archivedAt: null }).sort({ _id: 1 }).lean()
    if (modems.length === 0) {
      return Response.json({ error: 'No modems found in MongoDB. Wait for .NET gateway to push data first.' }, { status: 400 })
    }

    const now = new Date()
    const results: string[] = []

    const testUsers = [
      { username: 'yassine', password: 'yassine', displayName: 'Yassine', balance: 10000, modemIds: modems.slice(0, 3).map(m => m._id), withdrawAmount: 2000 },
      { username: 'ahmed', password: 'ahmed', displayName: 'Ahmed', balance: 7500, modemIds: modems.slice(3, 6).map(m => m._id), withdrawAmount: 1500 },
      { username: 'mohamed', password: 'mohamed', displayName: 'Mohamed', balance: 5000, modemIds: modems.slice(6, 10).map(m => m._id), withdrawAmount: 0 },
    ]

    for (const tu of testUsers) {
      const existing = await User.findOne({ username: tu.username, archivedAt: null })
      if (existing) {
        results.push(`User ${tu.username} already exists, skipping`)
        continue
      }

      const userId = nextId()
      await User.create({
        _id: userId,
        username: tu.username,
        password: tu.password,
        displayName: tu.displayName,
        role: 1,
        isActive: true,
        balance: tu.balance,
        machineId: 'web',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      })

      await UserBalanceHistory.create({
        _id: nextId(),
        userId,
        amount: tu.balance,
        balanceAfter: tu.balance,
        type: 0,
        simCardId: null,
        note: 'Initial seed credit',
        recordedAt: now,
        updatedAt: now,
        machineId: 'web',
        archivedAt: null,
      })

      for (const modemId of tu.modemIds) {
        const modem = await Modem.findById(modemId).lean()
        await UserModem.create({
          _id: nextId(),
          userId,
          modemId,
          assignedAt: now,
          machineId: 'web',
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
        })
      }
      results.push(`Created ${tu.username} (balance: ${tu.balance} DA, assigned ${tu.modemIds.length} modems)`)

      if (tu.withdrawAmount > 0) {
        await WithdrawalRequest.create({
          _id: nextId(),
          userId,
          amount: tu.withdrawAmount,
          status: 0,
          note: 'Test withdrawal request',
          adminNote: null,
          processedByAdminId: null,
          requestedAt: now,
          processedAt: null,
          createdAt: now,
          updatedAt: now,
          archivedAt: null,
          machineId: 'web',
        })
        results.push(`Created withdrawal request for ${tu.username}: ${tu.withdrawAmount} DA`)
      }
    }

    return Response.json({ ok: true, results })
  } catch (err) {
    console.error('SEED ERROR:', err)
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
