import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import type { UIMessage } from 'ai'
import { db } from '@/lib/db'
import { chatThreads } from '@/lib/db/schema'

export const THREAD_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

export type ThreadSummary = {
  id: string
  title: string
  clientSlug: string | null
  updatedAt: string
}

export async function getThread(userId: string, id: string) {
  if (!THREAD_ID_PATTERN.test(id)) return null
  const [row] = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function threadOwnedByAnotherUser(userId: string, id: string) {
  const [row] = await db.select({ userId: chatThreads.userId }).from(chatThreads).where(eq(chatThreads.id, id)).limit(1)
  return Boolean(row && row.userId !== userId)
}

export async function listThreads(userId: string, limit = 30): Promise<ThreadSummary[]> {
  const rows = await db
    .select({
      id: chatThreads.id,
      title: chatThreads.title,
      clientSlug: chatThreads.clientSlug,
      updatedAt: chatThreads.updatedAt,
    })
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(limit)
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))
}

function titleFrom(messages: UIMessage[]) {
  const firstUser = messages.find((m) => m.role === 'user')
  const text = firstUser?.parts.find((p) => p.type === 'text')
  const raw = text && 'text' in text ? text.text.trim() : ''
  if (!raw) return 'New conversation'
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
}

export async function saveThread(userId: string, id: string, clientSlug: string | null, messages: UIMessage[]) {
  const now = new Date()
  await db
    .insert(chatThreads)
    .values({ id, userId, clientSlug, title: titleFrom(messages), messages, updatedAt: now })
    .onConflictDoUpdate({
      target: chatThreads.id,
      set: { messages, updatedAt: now },
      setWhere: eq(chatThreads.userId, userId),
    })
}

export async function deleteThread(userId: string, id: string) {
  if (!THREAD_ID_PATTERN.test(id)) return
  await db.delete(chatThreads).where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
}
