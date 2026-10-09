import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Pages anyone can open without signing in. API routes check auth themselves
// (they return 401 instead of redirecting, and accept bearer tokens from iOS).
const PUBLIC_PATHS = ['/login', '/auth']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie if it has expired. A bearer token (iOS app,
  // end-to-end tests) is accepted too.
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : undefined
  const { data: { user } } = await supabase.auth.getUser(token)

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/api') || PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
