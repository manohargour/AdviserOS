import { and, asc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { alerts, clients, reviews, tasks } from '@/lib/db/schema'
import {
  alerts as sampleAlerts,
  clients as sampleClients,
  reviewsDue as sampleReviews,
  tasks as sampleTasks,
} from '@/lib/data'

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if ((session.user as { role?: string }).role === 'personal') redirect('/me')
  await ensureSeeded(session.user.id)
  return session.user
}

/** Gives each new adviser a starter book of sample clients so the workspace is never empty. */
export async function ensureSeeded(userId: string) {
  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId))
    .limit(1)
  if (existing) return

  await db.transaction(async (tx) => {
    // Serialise concurrent first loads for the same user so seeding runs once.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)
    const [again] = await tx
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.userId, userId))
      .limit(1)
    if (again) return

    await seedWorkspace(tx, userId)
  })
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function seedWorkspace(tx: Tx, userId: string) {
  {
    await tx.insert(clients).values(
      sampleClients.map((c) => ({ userId, slug: c.id, name: c.name, status: c.status, data: c })),
    )
    await tx.insert(reviews).values(
      sampleReviews.map((r) => ({
        userId,
        clientSlug: r.clientId ?? null,
        name: r.name,
        due: r.due,
        readiness: r.readiness,
        status: r.status,
      })),
    )
    await tx.insert(tasks).values(
      sampleTasks.map((t) => ({ userId, title: t.title, client: t.client, due: t.due, source: t.source, done: t.done })),
    )
    await tx.insert(alerts).values(
      sampleAlerts.map((a) => ({
        userId,
        title: a.title,
        client: a.client,
        clientSlug: a.clientId ?? null,
        severity: a.severity,
        time: a.time,
      })),
    )
  }
}

export async function getClients(userId: string) {
  const rows = await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(asc(clients.id))
  return rows.map((row) => ({ ...row.data, status: row.status as typeof row.data.status }))
}

export async function getClientBySlug(userId: string, slug: string) {
  const [row] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.slug, slug)))
    .limit(1)
  return row ? { ...row.data, status: row.status as typeof row.data.status } : undefined
}

export async function getReviews(userId: string) {
  return db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(asc(reviews.id))
}

export async function getReviewForClient(userId: string, slug: string) {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.clientSlug, slug)))
    .limit(1)
  return row
}

export async function saveLetterDraft(
  userId: string,
  client: { id: string; name: string; nextReview: string },
  letter: string,
) {
  const now = new Date()
  const updated = await db
    .update(reviews)
    .set({ letterDraft: letter, letterUpdatedAt: now })
    .where(and(eq(reviews.userId, userId), eq(reviews.clientSlug, client.id)))
    .returning({ id: reviews.id })
  if (updated.length === 0) {
    await db.insert(reviews).values({
      userId,
      clientSlug: client.id,
      name: client.name,
      due: client.nextReview,
      status: 'In progress',
      letterDraft: letter,
      letterUpdatedAt: now,
    })
  }
  return now
}

export async function getTasks(userId: string) {
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.done), asc(tasks.id))
}

export async function getAlerts(userId: string) {
  return db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.dismissed, false)))
    .orderBy(asc(alerts.id))
}
