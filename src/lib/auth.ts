import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'focusgate-dev-secret-change-in-production'
)

export interface AuthPayload extends JWTPayload {
  userId: string
  role: number
  username: string
}

export async function signToken(payload: { userId: string; role: number; username: string }): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as AuthPayload
  } catch {
    return null
  }
}
