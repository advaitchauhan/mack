import { NextResponse } from 'next/server'

// GET /api/app-config
// Public settings the native app needs to sign in with Supabase. Both values are
// already public in the web bundle (NEXT_PUBLIC_*).
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)' },
      { status: 500 }
    )
  }
  return NextResponse.json({ supabaseUrl, supabaseAnonKey })
}
