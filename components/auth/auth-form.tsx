'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Briefcase, Loader2, User, UserRoundCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/brand/logo-mark'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30'

type Role = 'personal' | 'client' | 'adviser'
type Audience = 'b2b' | 'b2c'

const AUDIENCES: { value: Audience; label: string; hint: string; icon: typeof User }[] = [
  { value: 'b2b', label: 'Adviser & client', hint: 'Advice firms and the clients they serve', icon: Briefcase },
  { value: 'b2c', label: 'Individual', hint: 'Manage my own wealth, no adviser', icon: User },
]

const B2B_ROLES: { value: Exclude<Role, 'personal'>; label: string; hint: string; icon: typeof User }[] = [
  { value: 'adviser', label: 'I’m an adviser', hint: 'Run reviews for my clients', icon: Briefcase },
  { value: 'client', label: 'I’m a client', hint: 'See and sign off my adviser’s reports', icon: UserRoundCheck },
]

const COPY: Record<Role, { signUpTitle: string; signUpBody: string; emailLabel: string }> = {
  adviser: {
    signUpTitle: 'Create your workspace',
    signUpBody: 'Set up your adviser account. We’ll load a sample client book so you can explore.',
    emailLabel: 'Work email',
  },
  personal: {
    signUpTitle: 'Create your account',
    signUpBody: 'See your whole financial life in one place, with an AI copilot to help you plan.',
    emailLabel: 'Email',
  },
  client: {
    signUpTitle: 'Join your adviser',
    signUpBody: 'Keep your adviser’s reviews alongside your own picture, and sign off reports in one place.',
    emailLabel: 'Email your adviser uses',
  },
}

function RadioCard({
  selected,
  onSelect,
  label,
  hint,
  icon: Icon,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  hint: string
  icon: typeof User
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
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
}

export function AuthForm({
  mode,
  initialRole = 'adviser',
  reportLink,
}: {
  mode: 'sign-in' | 'sign-up'
  initialRole?: Role
  reportLink?: string
}) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'
  const audience: Audience = role === 'personal' ? 'b2c' : 'b2b'
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
    if (accountRole === 'client') {
      router.push(isSignUp || reportLink ? `/me/adviser${reportLink ? `?link=${reportLink}` : ''}` : '/me')
    } else {
      router.push(accountRole === 'personal' ? '/me' : '/')
    }
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
            {AUDIENCES.map((a) => (
              <RadioCard
                key={a.value}
                selected={audience === a.value}
                onSelect={() => setRole(a.value === 'b2c' ? 'personal' : role === 'client' ? 'client' : 'adviser')}
                label={a.label}
                hint={a.hint}
                icon={a.icon}
              />
            ))}
          </div>
        </fieldset>

        {audience === 'b2b' && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Which side are you on?</legend>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {B2B_ROLES.map((t) => (
                <RadioCard
                  key={t.value}
                  selected={role === t.value}
                  onSelect={() => setRole(t.value)}
                  label={t.label}
                  hint={t.hint}
                  icon={t.icon}
                />
              ))}
            </div>
            {role === 'client' && reportLink && (
              <p className="mt-2 text-xs text-muted-foreground">
                The report your adviser sent will be added to your account.
              </p>
            )}
          </fieldset>
        )}

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
            href={`${isSignUp ? '/sign-in' : '/sign-up'}?as=${role}${reportLink ? `&link=${reportLink}` : ''}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </div>
    </div>
  )
}
