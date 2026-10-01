'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts, clients, reviews, tasks } from '@/lib/db/schema'
import { logActivity } from '@/lib/activity'
import { getClientBySlug, saveLetterDraft } from '@/lib/workspace'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function assertId(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) throw new Error('Invalid id')
}

async function slugForClientName(userId: string, name: string) {
  const [row] = await db
    .select({ slug: clients.slug })
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.name, name)))
    .limit(1)
  return row?.slug ?? null
}

export async function setTaskDone(id: number, done: boolean) {
  const userId = await getUserId()
  assertId(id)
  const [task] = await db
    .update(tasks)
    .set({ done: done === true })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ title: tasks.title, client: tasks.client })
  if (task) {
    await logActivity(userId, {
      action: done ? 'task.completed' : 'task.reopened',
      summary: `${done ? 'Completed' : 'Reopened'} task "${task.title}"`,
      clientSlug: await slugForClientName(userId, task.client),
    })
  }
  revalidatePath('/tasks')
  revalidatePath('/activity')
}

export async function dismissAlert(id: number) {
  const userId = await getUserId()
  assertId(id)
  const [alert] = await db
    .update(alerts)
    .set({ dismissed: true })
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .returning({ title: alerts.title, clientSlug: alerts.clientSlug })
  if (alert) {
    await logActivity(userId, {
      action: 'alert.dismissed',
      summary: `Dismissed alert "${alert.title}"`,
      clientSlug: alert.clientSlug,
    })
  }
  revalidatePath('/alerts')
  revalidatePath('/activity')
}

export async function saveReviewLetter(clientSlug: string, letter: string) {
  const userId = await getUserId()
  if (typeof clientSlug !== 'string' || !/^[a-z0-9-]{1,64}$/.test(clientSlug)) throw new Error('Invalid client')
  if (typeof letter !== 'string' || !letter.trim() || letter.length > 20000) throw new Error('Invalid letter')

  const client = await getClientBySlug(userId, clientSlug)
  if (!client) throw new Error('Client not found')

  const savedAt = await saveLetterDraft(userId, client, letter.trim())
  await logActivity(userId, {
    action: 'letter.edited',
    summary: `Edited the annual review letter for ${client.name}`,
    clientSlug,
  })
  revalidatePath(`/reviews/${clientSlug}`)
  revalidatePath('/activity')
  return savedAt.toISOString()
}

export async function approveReview(clientSlug: string, confirmedItems: string[]) {
  const userId = await getUserId()
  if (typeof clientSlug !== 'string' || !/^[a-z0-9-]{1,64}$/.test(clientSlug)) throw new Error('Invalid client')
  const items = Array.isArray(confirmedItems)
    ? confirmedItems.filter((i): i is string => typeof i === 'string' && i.length <= 64).slice(0, 50)
    : []

  const [review] = await db
    .update(reviews)
    .set({ status: 'Approved', readiness: 100, confirmedItems: items, approvedAt: new Date() })
    .where(and(eq(reviews.userId, userId), eq(reviews.clientSlug, clientSlug)))
    .returning({ name: reviews.name })
  await db
    .update(clients)
    .set({ status: 'Up to Date', updatedAt: new Date() })
    .where(and(eq(clients.userId, userId), eq(clients.slug, clientSlug)))

  if (review) {
    await logActivity(userId, {
      action: 'review.approved',
      summary: `Approved ${review.name}'s review (${items.length} ${items.length === 1 ? 'item' : 'items'} confirmed)`,
      clientSlug,
    })
  }

  revalidatePath('/reviews')
  revalidatePath(`/reviews/${clientSlug}`)
  revalidatePath('/clients')
  revalidatePath(`/clients/${clientSlug}`)
  revalidatePath('/activity')
}
