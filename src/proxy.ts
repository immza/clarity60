import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { clientIp, rateLimit } from './lib/rateLimit'

// Sign-in endpoints: 10 attempts per IP per 10 minutes, on top of Payload's per-account lockout.
const AUTH_PATHS = /^\/api\/users\/(login|forgot-password|reset-password|first-register|unlock)$|^\/api\/(verify-totp|setup-totp)$/
const AUTH_LIMIT = 10
const AUTH_WINDOW_MS = 10 * 60_000

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.method === 'POST' && AUTH_PATHS.test(pathname)) {
    const { allowed, retryAfter } = rateLimit(`auth:${clientIp(request.headers)}`, AUTH_LIMIT, AUTH_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json(
        { errors: [{ message: 'Too many attempts. Please wait a few minutes and try again.' }] },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }
  }

  // payload-totp reads the pathname in server components; headers() sees request headers.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: ['/((?!sentry-tunnel|_next/static|_next/image|favicon.ico|media/).*)'],
}
