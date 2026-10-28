import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// payload-totp needs the pathname in server components to avoid a redirect loop.
export function proxy(request: NextRequest) {
  // headers() in server components reads request headers, so forward it on the request.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/((?!sentry-tunnel|_next/static|_next/image|favicon.ico|media/).*)'],
}
