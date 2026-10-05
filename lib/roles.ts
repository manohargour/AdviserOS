import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/**
 * adviser  – runs client reviews in AdviserOS
 * personal – independent (B2C) user managing their own wealth, no adviser
 * client   – personal user who is served by an adviser and receives their reports
 */
export type Role = 'adviser' | 'personal' | 'client'
export type PersonalRole = Exclude<Role, 'adviser'>

export function normalizeRole(value: unknown): Role {
  return value === 'personal' || value === 'client' ? value : 'adviser'
}

export function isPersonalRole(role: Role): role is PersonalRole {
  return role === 'personal' || role === 'client'
}

export function homeFor(role: Role) {
  return isPersonalRole(role) ? '/me' : '/'
}

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const role = normalizeRole((session.user as { role?: string }).role)
  return { ...session.user, role }
}

export async function requireAdviser() {
  const user = await getSessionUser()
  if (!user) redirect('/sign-in')
  if (isPersonalRole(user.role)) redirect('/me')
  return user
}

export async function requirePersonal() {
  const user = await getSessionUser()
  if (!user) redirect('/sign-in?as=personal')
  if (!isPersonalRole(user.role)) redirect('/')
  return { ...user, role: user.role as PersonalRole }
}
