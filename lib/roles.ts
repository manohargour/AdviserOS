import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export type Role = 'adviser' | 'personal'

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const role: Role = (session.user as { role?: string }).role === 'personal' ? 'personal' : 'adviser'
  return { ...session.user, role }
}

export async function requireAdviser() {
  const user = await getSessionUser()
  if (!user) redirect('/sign-in')
  if (user.role === 'personal') redirect('/me')
  return user
}

export async function requirePersonal() {
  const user = await getSessionUser()
  if (!user) redirect('/sign-in')
  if (user.role !== 'personal') redirect('/')
  return user
}
