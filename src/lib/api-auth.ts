import { type NextRequest } from 'next/server'
import { verifyToken, type AuthPayload } from '@/lib/auth'

function getTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('token')
  return cookie?.value ?? null
}

export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const token = getTokenFromRequest(request)
  if (!token) {
    throw new AuthError(401, 'Authentication required')
  }
  const payload = await verifyToken(token)
  if (!payload) {
    throw new AuthError(401, 'Invalid or expired token')
  }
  return payload
}

export async function requireAdmin(request: NextRequest): Promise<AuthPayload> {
  const auth = await requireAuth(request)
  if (auth.role !== 0) {
    throw new AuthError(403, 'Admin access required')
  }
  return auth
}

export class AuthError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'AuthError'
  }
}
