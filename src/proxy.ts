import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (token.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
