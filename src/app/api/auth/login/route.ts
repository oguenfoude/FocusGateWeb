import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import { signToken } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(req, 'login', 5, 60_000)) {
      return Response.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const { username, password } = body

    if (!username || !password) {
      return Response.json({ error: 'Username and password are required' }, { status: 400 })
    }

    await connectDB()

    const db = mongoose.connection.db
    if (!db) {
      return Response.json({ error: 'Database connection not established' }, { status: 500 })
    }

    const user = await db.collection('users').findOne({
      username: username.trim(),
      archivedAt: null,
    }) as { _id?: unknown, password?: string, isActive?: boolean, role?: number } | null

    if (!user || !user.isActive) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    let passwordMatch = false

    if (user.password && user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password)
    } else {
      passwordMatch = user.password === password
      if (passwordMatch && user._id) {
        const hashed = await bcrypt.hash(password, 10)
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { password: hashed } }
        )
      }
    }

    if (!passwordMatch) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const userId = user._id?.toString() || ''
    const role = user.role ?? 1

    const token = await signToken({ userId, role, username: username.trim() })

    const response = Response.json({
      ok: true,
      userId,
      role,
      username: username.trim(),
    })

    response.headers.set(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    )

    return response
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
