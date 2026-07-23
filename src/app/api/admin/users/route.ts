import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { nextId } from '@/lib/id-generator'
import { toNum } from '@/lib/number-utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createUserSchema = z.object({
  username: z.string().trim().min(2).max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, underscore, dot, or dash'),
  password: z.string().min(4).max(128),
  displayName: z.string().trim().max(100).optional(),
})

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const showArchived = searchParams.get('showArchived') === 'true'
    const includeAdmin = searchParams.get('includeAdmin') === 'true'
    
    const filter: Record<string, unknown> = showArchived ? {} : { archivedAt: null }
    if (!includeAdmin) {
      filter.role = { $ne: 0 } // Exclude Admin (Role = 0)
    }

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
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return Response.json({ error: issue?.message ?? 'Invalid input' }, { status: 400 })
    }
    const { username, password, displayName } = parsed.data

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
