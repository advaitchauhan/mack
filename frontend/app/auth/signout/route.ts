import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /auth/signout
export async function POST(request: NextRequest) {
  await createClient().auth.signOut()
  return NextResponse.redirect(`${request.nextUrl.origin}/login`, { status: 303 })
}
