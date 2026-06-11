import { NextRequest, NextResponse } from 'next/server'
import {
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_MAX_AGE,
  getExpectedSessionToken,
  isStaffPasswordCorrect,
} from '@/lib/auth'

function safeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/admin'
  return path
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const password = formData.get('password')?.toString() ?? ''
  const redirectTo = safeRedirectPath(formData.get('redirect')?.toString() ?? null)

  if (!isStaffPasswordCorrect(password)) {
    const url = new URL('/login', req.url)
    url.searchParams.set('error', '1')
    url.searchParams.set('redirect', redirectTo)
    return NextResponse.redirect(url, 303)
  }

  const token = await getExpectedSessionToken()
  const res = NextResponse.redirect(new URL(redirectTo, req.url), 303)
  res.cookies.set(STAFF_SESSION_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STAFF_SESSION_MAX_AGE,
    path: '/',
  })
  return res
}
