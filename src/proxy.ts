import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// payload-totp needs the pathname in server components to avoid a redirect loop.
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.append('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|media/).*)'],
}
