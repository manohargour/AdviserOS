'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { isDemoEmail } from '@/lib/demo-account'
import { resetDemoWorkspace } from '@/lib/demo'

export async function resetDemoData() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (!isDemoEmail(session.user.email)) throw new Error('Only the shared demo account can be reset')

  await resetDemoWorkspace(session.user.id)
  revalidatePath('/', 'layout')
}
