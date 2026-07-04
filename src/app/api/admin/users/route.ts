import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const showArchived = searchParams.get('showArchived') === 'true'
    const filter = showArchived ? {} : { archivedAt: null }

    const users = await User.find(filter).select('-password').lean()

    const UserModem = (await import('@/lib/models/UserModem')).UserModem
    const counts = await UserModem.aggregate([
      { $match: { removedAt: null, archivedAt: null } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ])
    const countMap = new Map(counts.map(c => [String(c._id), c.count]))

    const result = users.map(u => ({
      ...u,
      _id: String(u._id),
      balance: toNum(u.balance),
      assignedModemsCount: countMap.get(String(u._id)) || 0,
    }))

    return Response.json(result)
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password, displayName } = body

    if (!username || !password) {
      return Response.json({ error: 'Username and Password are required' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ username }).lean()
    if (existing) {
      return Response.json({ error: 'Username already exists' }, { status: 409 })
    }

    const now = new Date()
    const userId = nextId()

    await User.create({
      _id: userId,
      username,
      password,
      displayName: displayName || username,
      role: 1,
      isActive: true,
      balance: 0,
      machineId: 'web',
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
