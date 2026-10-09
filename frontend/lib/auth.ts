import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface AuthUser {
  id: string
  email?: string
}

// Resolves the signed-in user for an API request. The web app sends the
// Supabase session cookie; the iOS app sends `Authorization: Bearer <access token>`.
export async function getUser(request: NextRequest): Promise<AuthUser | null> {
  const devUser = devBypassUser()
  if (devUser) return devUser

  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email }
}

// Local development only: with DEV_USER_ID set and NODE_ENV not production,
// every request is treated as that user, so the iOS Simulator can talk to a
// local server before Sign in with Apple is wired up. Vercel deployments
// (preview and production) always run with NODE_ENV=production.
export function devBypassUser(): AuthUser | null {
  if (process.env.NODE_ENV === 'production' || !process.env.DEV_USER_ID) return null
  return { id: process.env.DEV_USER_ID }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
}
