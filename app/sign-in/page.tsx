import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser, homeFor, normalizeRole } from '@/lib/roles'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const user = await getSessionUser()
  if (user) redirect(homeFor(user.role))
  const { as } = await searchParams
  return <AuthForm mode="sign-in" initialRole={normalizeRole(as)} />
}
