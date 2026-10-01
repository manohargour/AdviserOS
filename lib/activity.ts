import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityLog } from '@/lib/db/schema'

export type ActivityAction =
  | 'task.created'
  | 'task.completed'
  | 'task.reopened'
  | 'alert.dismissed'
  | 'review.approved'
  | 'conversation.started'
  | 'letter.drafted'
  | 'letter.edited'

export type ActivityEntry = typeof activityLog.$inferSelect

export async function logActivity(
  userId: string,
  entry: { action: ActivityAction; summary: string; actor?: 'adviser' | 'assistant'; clientSlug?: string | null },
) {
  try {
    await db.insert(activityLog).values({
      userId,
      action: entry.action,
      summary: entry.summary.slice(0, 500),
      actor: entry.actor ?? 'adviser',
      clientSlug: entry.clientSlug ?? null,
    })
  } catch (error) {
    console.error('Failed to write activity log', error)
  }
}

export async function getActivity(userId: string, options: { clientSlug?: string; limit?: number } = {}) {
  const where = options.clientSlug
    ? and(eq(activityLog.userId, userId), eq(activityLog.clientSlug, options.clientSlug))
    : eq(activityLog.userId, userId)
  return db
    .select()
    .from(activityLog)
    .where(where)
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(Math.min(options.limit ?? 100, 500))
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
