import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { username, password } = body

    if (!username || !password) {
      return Response.json({ error: 'Username and password are required' }, { status: 400 })
    }

    await connectDB()

    // Plain text matching for passwords as per AGENTS.md rule
    const user = await User.findOne({
      username: username.trim(),
      archivedAt: null,
    }).lean()

    if (!user || user.password !== password) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ error: 'Account is inactive' }, { status: 403 })
    }

    return Response.json({
      ok: true,
      userId: String(user._id),
      role: user.role,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
