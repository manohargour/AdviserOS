'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts, clients, reviews, tasks } from '@/lib/db/schema'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function assertId(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) throw new Error('Invalid id')
}

export async function setTaskDone(id: number, done: boolean) {
  const userId = await getUserId()
  assertId(id)
  await db
    .update(tasks)
    .set({ done: done === true })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  revalidatePath('/tasks')
}

export async function dismissAlert(id: number) {
  const userId = await getUserId()
  assertId(id)
  await db
    .update(alerts)
    .set({ dismissed: true })
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
  revalidatePath('/alerts')
}

export async function approveReview(clientSlug: string, confirmedItems: string[]) {
  const userId = await getUserId()
  if (typeof clientSlug !== 'string' || !/^[a-z0-9-]{1,64}$/.test(clientSlug)) throw new Error('Invalid client')
  const items = Array.isArray(confirmedItems)
    ? confirmedItems.filter((i): i is string => typeof i === 'string' && i.length <= 64).slice(0, 50)
    : []

  await db
    .update(reviews)
    .set({ status: 'Approved', readiness: 100, confirmedItems: items, approvedAt: new Date() })
    .where(and(eq(reviews.userId, userId), eq(reviews.clientSlug, clientSlug)))
  await db
    .update(clients)
    .set({ status: 'Up to Date', updatedAt: new Date() })
    .where(and(eq(clients.userId, userId), eq(clients.slug, clientSlug)))

  revalidatePath('/reviews')
  revalidatePath(`/reviews/${clientSlug}`)
  revalidatePath('/clients')
  revalidatePath(`/clients/${clientSlug}`)
}
