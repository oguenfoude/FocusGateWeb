import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { UserModem } from '@/lib/models/UserModem'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const showArchived = searchParams.get('showArchived') === 'true'
    const filter = showArchived ? {} : { archivedAt: null }

    const users = await User.find(filter).select('-password').lean()

    const counts = await UserModem.aggregate([
      { $match: { removedAt: null, archivedAt: null } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ])
    const countMap = new Map(counts.map(c => [String(c._id), c.count]))

    const result = users.map(u => ({
      ...u,
      _id: String(u._id),
      balance: Number(u.balance) || 0,
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
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const lastUser = await User.findOne().sort({ _id: -1 }).lean()
    const nextId = lastUser ? lastUser._id + 1 : 1

    const machineId = '419c0cfc97666753'

    const newUser = await User.create({
      _id: nextId,
      username,
      password,
      displayName: displayName || username,
      role: 1,
      balance: 0,
      machineId,
      createdAt: new Date(),
      updatedAt: new Date(),
      archivedAt: null,
    })

    return Response.json({
      ok: true,
      user: {
        _id: String(newUser._id),
        username: newUser.username,
        displayName: newUser.displayName,
      }
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
