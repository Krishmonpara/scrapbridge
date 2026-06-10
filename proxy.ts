import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const PROTECTED = ['/dashboard', '/my-listings', '/post-listing', '/settings', '/inquiries']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
