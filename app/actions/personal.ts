'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { reportAcknowledgements } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/roles'

export type LinkState = { ok: boolean; message: string } | null

/** Accepts the full sign-off URL from the email or just its token. */
function extractToken(input: string) {
  const trimmed = input.trim()
  const fromUrl = trimmed.match(/\/ack\/([A-Za-z0-9_-]{20,64})/)
  const token = fromUrl ? fromUrl[1] : trimmed
  return /^[A-Za-z0-9_-]{20,64}$/.test(token) ? token : null
}

export async function linkAdviserReport(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const user = await getSessionUser()
  if (!user || user.role !== 'personal') return { ok: false, message: 'Sign in to your personal account first.' }

  const token = extractToken(String(formData.get('link') ?? ''))
  if (!token) return { ok: false, message: 'That doesn’t look like a report link. Paste the link from your adviser’s email.' }

  const [ack] = await db
    .select({ id: reportAcknowledgements.id, personalUserId: reportAcknowledgements.personalUserId })
    .from(reportAcknowledgements)
    .where(eq(reportAcknowledgements.token, token))
    .limit(1)

  if (!ack) return { ok: false, message: 'We couldn’t find that report. Check the link and try again.' }
  if (ack.personalUserId === user.id) return { ok: true, message: 'This report is already in your account.' }
  if (ack.personalUserId) return { ok: false, message: 'This report is already linked to another account.' }

  const updated = await db
    .update(reportAcknowledgements)
    .set({ personalUserId: user.id })
    .where(and(eq(reportAcknowledgements.id, ack.id), isNull(reportAcknowledgements.personalUserId)))
    .returning({ id: reportAcknowledgements.id })

  if (updated.length === 0) return { ok: false, message: 'This report is already linked to another account.' }

  revalidatePath('/me/adviser')
  return { ok: true, message: 'Report added. Your adviser’s reports will appear here.' }
}
