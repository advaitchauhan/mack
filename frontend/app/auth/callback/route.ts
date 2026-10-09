import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /auth/callback - Supabase redirects here after Google or magic-link sign-in
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'
  // Only allow relative redirects
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=1`)
}
