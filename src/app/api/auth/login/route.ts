import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
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

    if (!user || user.password !== password) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    return Response.json({
      ok: true,
      userId: user._id?.toString(),
      role: user.role,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
