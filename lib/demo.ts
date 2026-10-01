import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityLog, alerts, chatThreads, clients, reviews, tasks, user } from '@/lib/db/schema'
import { DEMO_EMAIL } from '@/lib/demo-account'
import { seedWorkspace } from '@/lib/workspace'

const STARTER_THREAD_ID = 'demo-starter-thread'

export async function findDemoUserId() {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO_EMAIL)).limit(1)
  return row?.id ?? null
}

/** Wipes the shared demo account and restores the original sample book in one transaction. */
export async function resetDemoWorkspace(userId: string) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)

    await tx.delete(chatThreads).where(eq(chatThreads.userId, userId))
    await tx.delete(activityLog).where(eq(activityLog.userId, userId))
    await tx.delete(alerts).where(eq(alerts.userId, userId))
    await tx.delete(tasks).where(eq(tasks.userId, userId))
    await tx.delete(reviews).where(eq(reviews.userId, userId))
    await tx.delete(clients).where(eq(clients.userId, userId))

    await seedWorkspace(tx, userId)

    await tx.insert(activityLog).values({
      userId,
      actor: 'assistant',
      action: 'workspace.reset',
      summary: 'Demo workspace reset to the original sample data',
    })

    await tx.insert(chatThreads).values({
      id: STARTER_THREAD_ID,
      userId,
      clientSlug: 'emma-thompson',
      title: 'What should I raise with Emma at her next meeting?',
      messages: [
        {
          id: 'demo-starter-user',
          role: 'user',
          parts: [{ type: 'text', text: 'What should I raise with Emma at her next meeting?' }],
        },
        {
          id: 'demo-starter-assistant',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: "Here's what I'd cover with Emma Thompson:\n\n1. **Business sale** – she's exploring selling her company within 18 months, so confirm the timeline and buyer interest.\n2. **Business Asset Disposal Relief** – chase her accountant on eligibility; it's still an open task.\n3. **Missing paperwork** – we still need the business valuation report before her review on 11 Nov 2026.\n4. **Post-sale plan** – start shaping how sale proceeds fit her pension, ISA and cash goals.\n\nWant me to draft an agenda or open her review?",
            },
          ],
        },
      ],
    })
  })
}
