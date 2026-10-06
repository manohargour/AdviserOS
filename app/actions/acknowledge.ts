'use server'

import { and, eq, gt, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { reportAcknowledgements } from '@/lib/db/schema'
import { logActivity } from '@/lib/activity'
import { ACK_TTL_MS } from '@/lib/report-status'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/

export type AcknowledgeState = { error?: string } | null

export async function acknowledgeReport(token: string, _prev: AcknowledgeState, formData: FormData): Promise<AcknowledgeState> {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return { error: 'This link is not valid.' }
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const comment = String(formData.get('comment') ?? '').trim().slice(0, 2000)
  if (!name) return { error: 'Please type your full name.' }
  if (formData.get('confirm') !== 'on') return { error: 'Please tick the box to confirm.' }

  const notExpired = gt(reportAcknowledgements.createdAt, new Date(Date.now() - ACK_TTL_MS))
  const [row] = await db
    .update(reportAcknowledgements)
    .set({ acknowledgedAt: new Date(), acknowledgedName: name, comment: comment || null })
    .where(and(eq(reportAcknowledgements.token, token), isNull(reportAcknowledgements.acknowledgedAt), notExpired))
    .returning({ userId: reportAcknowledgements.userId, clientSlug: reportAcknowledgements.clientSlug })

  if (!row) {
    // Either already acknowledged, invalid, or past its expiry window.
    const [existing] = await db
      .select({ acknowledgedAt: reportAcknowledgements.acknowledgedAt, createdAt: reportAcknowledgements.createdAt })
      .from(reportAcknowledgements)
      .where(eq(reportAcknowledgements.token, token))
      .limit(1)
    if (existing && !existing.acknowledgedAt && Date.now() - existing.createdAt.getTime() >= ACK_TTL_MS) {
      return { error: 'This confirmation link has expired. Please ask your adviser to resend your report.' }
    }
    revalidatePath(`/ack/${token}`)
    return null
  }

  await logActivity(row.userId, {
    action: 'report.acknowledged',
    summary: `${name} confirmed receipt of their annual review report${comment ? ' and left a comment' : ''}`,
    clientSlug: row.clientSlug,
  })
  revalidatePath('/activity')
  revalidatePath(`/reviews/${row.clientSlug}/report`)
  revalidatePath(`/ack/${token}`)
  return null
}
