import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/roles'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const user = await getSessionUser()
  if (user) redirect(user.role === 'personal' ? '/me' : '/')
  const { as } = await searchParams
  return <AuthForm mode="sign-up" initialRole={as === 'personal' ? 'personal' : 'adviser'} />
}
