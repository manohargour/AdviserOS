'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/brand/logo-mark'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

type Role = 'personal' | 'adviser'

const ROLES: { value: Role; label: string; hint: string; icon: typeof User }[] = [
  { value: 'personal', label: 'Personal', hint: 'Manage my own wealth', icon: User },
  { value: 'adviser', label: 'Adviser', hint: 'Manage client reviews', icon: Briefcase },
]

const COPY = {
  adviser: {
    signUpTitle: 'Create your workspace',
    signUpBody: 'Set up your adviser account. We’ll load a sample client book so you can explore.',
    emailLabel: 'Work email',
  },
  personal: {
    signUpTitle: 'Create your account',
    signUpBody: 'See your whole financial life in one place, with an AI copilot and your adviser’s reports.',
    emailLabel: 'Email',
  },
}

export function AuthForm({ mode, initialRole = 'adviser' }: { mode: 'sign-in' | 'sign-up'; initialRole?: Role }) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'
  const copy = COPY[role]

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()

    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name, role })
      : await authClient.signIn.email({ email, password })

    if (result.error) {
      console.error('[auth]', result.error)
      setError(
        isSignUp
          ? 'We couldn’t create your account. Check your details and try again.'
          : 'Incorrect email or password.',
      )
      setPending(false)
      return
    }
    // The account's stored role decides the destination, not the toggle.
    const accountRole = (result.data?.user as { role?: string } | undefined)?.role
    router.push(accountRole === 'personal' ? '/me' : '/')
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold">AdviserOS</p>
            <p className="text-[11px] text-muted-foreground">Wealth, for advisers and the people they serve</p>
          </div>
        </div>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          {isSignUp ? copy.signUpTitle : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? copy.signUpBody : 'Sign in to pick up where you left off.'}
        </p>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium">{isSignUp ? 'I’m signing up as' : 'I’m signing in as'}</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {ROLES.map(({ value, label, hint, icon: Icon }) => {
              const selected = role === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRole(value)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                    selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
                  )}
                >
                  <Icon aria-hidden className={cn('size-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{hint}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Full name
              </label>
              <input id="name" name="name" required autoComplete="name" className={inputClass} />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {copy.emailLabel}
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 aria-hidden className="animate-spin" />}
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : 'New to AdviserOS? '}
          <Link
            href={`${isSignUp ? '/sign-in' : '/sign-up'}?as=${role}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  )
}
