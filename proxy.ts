import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================
// Public Routes (No authentication required)
// ============================================
const publicRoutes = [
  '/',                    // Landing page
  '/pricing',             // Pricing page
  '/terms',
  '/privacy',
  '/commercial-transactions',
]

const publicPrefixes = [
  '/auth/',               // Auth pages (signin, signup)
  '/api/auth/',           // Auth API routes
  '/api/anonymous',       // Anonymous usage API
  '/_next/',              // Next.js internal
  '/favicon.ico',
  '/public/',
]

// Routes that require authentication
const protectedPrefixes = [
  '/projects',
  '/edit/',
  '/processing/',
  '/home',
  '/styles',
  '/style-analysis',
  '/api/projects',
  '/api/export',
  '/api/analyze',
  '/api/process',
]

// Check if path is public
function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (publicRoutes.includes(pathname)) {
    return true
  }

  // Prefix match
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return false
}

// Check if path requires authentication
function isProtectedRoute(pathname: string): boolean {
  for (const prefix of protectedPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    // Check for session token (better-auth uses 'better-auth.session_token')
    const sessionToken = request.cookies.get('better-auth.session_token')

    if (!sessionToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Redirect to signin with callback URL
      const signinUrl = new URL('/auth/signin', request.url)
      const callbackUrl = `${pathname}${request.nextUrl.search}`
      signinUrl.searchParams.set('callbackUrl', callbackUrl)
      return NextResponse.redirect(signinUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/upload (large multipart bodies should bypass proxy)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/upload).*)',
  ],
}
