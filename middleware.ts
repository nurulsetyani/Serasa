import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { STAFF_SESSION_COOKIE, getExpectedSessionToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  // Local dev with mock data — skip the password gate entirely.
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return NextResponse.next()
  }

  const expected = await getExpectedSessionToken()
  const cookie = req.cookies.get(STAFF_SESSION_COOKIE)?.value

  if (expected && cookie === expected) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/pos/:path*', '/kitchen/:path*', '/qr/:path*'],
}
