'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? 'Sign-in failed. Please try again.' : null
  )

  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const signInWithGoogle = async () => {
    setError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    if (error) setError(error.message)
  }

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('sending')
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    })
    if (error) {
      setError(error.message)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="h-6 w-6 text-rose-500" />
          <CardTitle className="text-2xl">Mack</CardTitle>
        </div>
        <CardDescription>Sign in to start practicing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" variant="outline" onClick={signInWithGoogle}>
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>
        {status === 'sent' ? (
          <p className="text-sm text-center text-muted-foreground">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <form onSubmit={sendMagicLink} className="space-y-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button className="w-full" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-center text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
