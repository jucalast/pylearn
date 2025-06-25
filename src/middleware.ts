import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect dashboard and API routes (except auth)
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      (request.nextUrl.pathname.startsWith('/api') && 
       !request.nextUrl.pathname.startsWith('/api/auth'))) {
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // For API routes, let the route handlers validate the JWT
    // For dashboard routes, we just check if token exists
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      // Basic token format validation
      if (token.length < 20) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth).*)']
}
