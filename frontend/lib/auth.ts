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

export function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
}
