import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser, homeFor, normalizeRole } from '@/lib/roles'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = { title: 'Create account' }

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; link?: string }>
}) {
  const { as, link } = await searchParams
  const reportLink = link && /^[A-Za-z0-9_-]{20,64}$/.test(link) ? link : undefined
  const user = await getSessionUser()
  if (user) {
    redirect(reportLink && homeFor(user.role) === '/me' ? `/me/adviser?link=${reportLink}` : homeFor(user.role))
  }
  return <AuthForm mode="sign-up" initialRole={reportLink ? 'client' : normalizeRole(as)} reportLink={reportLink} />
}
