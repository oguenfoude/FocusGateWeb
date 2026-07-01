import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

const PUBLIC_PATHS = ['/login', '/api/auth']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow public paths (login page, auth API)
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) {
    // If already logged in and visiting /login, redirect to dashboard
    const token = request.cookies.get('next-auth.session-token')?.value
    if (token && pathname === '/login') {
      const payload = decodeJwtPayload(token)
      const role = payload?.role as string | undefined
      const dest = role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // Check session cookie for protected routes
  const token = request.cookies.get('next-auth.session-token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Decode JWT to check role
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = payload.role as string | undefined

  // Admin-only routes: /admin/*
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and internal paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
