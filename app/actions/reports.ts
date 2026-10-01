'use server'

import { and, desc, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reportSends, reports } from '@/lib/db/schema'
import { logActivity } from '@/lib/activity'
import { getClientBySlug, getReviewForClient } from '@/lib/workspace'
import { getReport, reportFileName } from '@/lib/reports'
import { isEditable } from '@/lib/report-status'
import { renderReportPdf } from '@/lib/report-pdf'
import { sendReportEmail } from '@/lib/email'
import { DEMO_RECIPIENT_EMAIL, isDemoEmail } from '@/lib/demo-account'

type Result = { ok: true; message?: string } | { ok: false; error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function clean(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length ? trimmed : null
}

function refresh(id?: number) {
  revalidatePath('/reports')
  if (id) revalidatePath(`/reports/${id}`)
  revalidatePath('/activity')
}

export async function createReport(clientSlug: string) {
  const user = await getSessionUser()
  const client = typeof clientSlug === 'string' ? await getClientBySlug(user.id, clientSlug) : null
  if (!client) throw new Error('Client not found')
  const review = await getReviewForClient(user.id, client.id)
  const [row] = await db
    .insert(reports)
    .values({
      userId: user.id,
      clientSlug: client.id,
      title: `Annual Review Report — ${client.name} (${client.nextReview})`,
      recipientEmail: isDemoEmail(user.email) ? DEMO_RECIPIENT_EMAIL : null,
      letter: review?.letterDraft ?? null,
      coverNote: `Dear ${client.firstName},\n\nPlease find enclosed your annual review report ahead of our meeting. It summarises your portfolio, asset allocation and the changes since your last review.`,
    })
    .returning({ id: reports.id })
  await logActivity(user.id, { action: 'report.created', summary: `Created report draft for ${client.name}`, clientSlug: client.id })
  refresh()
  redirect(`/reports/${row.id}`)
}

export async function updateReport(
  id: number,
  input: { title: string; coverNote: string; letter: string; recipientEmail: string },
): Promise<Result> {
  const user = await getSessionUser()
  const report = await getReport(user.id, id)
  if (!report) return { ok: false, error: 'Report not found' }
  if (!isEditable(report.status)) return { ok: false, error: 'Move the report back to draft before editing.' }
  const title = clean(input.title, 200)
  if (!title) return { ok: false, error: 'Title is required' }
  const recipientEmail = clean(input.recipientEmail, 254)
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) return { ok: false, error: 'Enter a valid client email' }

  await db
    .update(reports)
    .set({
      title,
      coverNote: clean(input.coverNote, 4000),
      letter: clean(input.letter, 12000),
      recipientEmail,
      updatedAt: new Date(),
    })
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
  await logActivity(user.id, { action: 'report.edited', summary: `Edited report "${title}"`, clientSlug: report.clientSlug })
  refresh(id)
  return { ok: true, message: 'Saved' }
}

const TRANSITIONS = {
  submit: { from: ['draft'], to: 'in_review', verb: 'Submitted for review' },
  approve: { from: ['in_review'], to: 'approved', verb: 'Approved' },
  reopen: { from: ['in_review', 'approved', 'sent'], to: 'draft', verb: 'Moved back to draft' },
} as const

export async function transitionReport(id: number, step: keyof typeof TRANSITIONS): Promise<Result> {
  const user = await getSessionUser()
  const t = TRANSITIONS[step]
  if (!t) return { ok: false, error: 'Unknown step' }
  const report = await getReport(user.id, id)
  if (!report) return { ok: false, error: 'Report not found' }
  if (!(t.from as readonly string[]).includes(report.status)) return { ok: false, error: `Can't ${step} a report that is ${report.status}` }

  const now = new Date()
  await db
    .update(reports)
    .set({
      status: t.to,
      updatedAt: now,
      ...(step === 'submit' ? { submittedAt: now } : {}),
      ...(step === 'approve' ? { approvedAt: now } : {}),
      ...(step === 'reopen' ? { approvedAt: null } : {}),
    })
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
  await logActivity(user.id, { action: `report.${step}`, summary: `${t.verb}: "${report.title}"`, clientSlug: report.clientSlug })
  refresh(id)
  return { ok: true }
}

export async function emailReviewReport(
  clientSlug: string,
  input: { to: string; subject: string; message: string },
): Promise<Result> {
  const user = await getSessionUser()
  const client = typeof clientSlug === 'string' ? await getClientBySlug(user.id, clientSlug) : null
  if (!client) return { ok: false, error: 'Client not found' }
  const review = await getReviewForClient(user.id, client.id)
  if (review?.status !== 'Approved') return { ok: false, error: 'Approve the review before emailing the report.' }

  const [existing] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.userId, user.id), eq(reports.clientSlug, client.id), inArray(reports.status, ['approved', 'sent'])))
    .orderBy(desc(reports.updatedAt))
    .limit(1)

  let reportId = existing?.id
  if (!reportId) {
    const now = new Date()
    const [row] = await db
      .insert(reports)
      .values({
        userId: user.id,
        clientSlug: client.id,
        title: `Annual Review Report — ${client.name} (${client.nextReview})`,
        status: 'approved',
        submittedAt: now,
        approvedAt: review.approvedAt ?? now,
        letter: review.letterDraft ?? null,
        coverNote: clean(input.message, 4000),
      })
      .returning({ id: reports.id })
    reportId = row.id
    await logActivity(user.id, { action: 'report.created', summary: `Created approved report for ${client.name} from review`, clientSlug: client.id })
  }

  const result = await sendReport(reportId, input)
  revalidatePath(`/reviews/${client.id}/report`)
  return result
}

export async function sendReport(id: number, input: { to: string; subject: string; message: string }): Promise<Result> {
  const user = await getSessionUser()
  const report = await getReport(user.id, id)
  if (!report) return { ok: false, error: 'Report not found' }
  if (report.status !== 'approved' && report.status !== 'sent') return { ok: false, error: 'Approve the report before sending it.' }
  const to = clean(input.to, 254)
  if (!to || !EMAIL_RE.test(to)) return { ok: false, error: 'Enter a valid client email' }
  const subject = clean(input.subject, 200) ?? report.title
  const message = clean(input.message, 4000) ?? 'Please find your annual review report attached.'
  const client = await getClientBySlug(user.id, report.clientSlug)
  if (!client) return { ok: false, error: 'Client not found' }

  const pdf = await renderReportPdf({
    client,
    adviserName: user.name,
    title: report.title,
    status: 'Approved',
    coverNote: report.coverNote,
    letter: report.letter,
    reference: `AR-${client.initials}-${report.id}`,
    issuedOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  })

  const result = await sendReportEmail({
    to,
    replyTo: user.email,
    subject,
    message,
    adviserName: user.name,
    pdf,
    fileName: reportFileName(client.name, report.id),
    idempotencyKey: `report-${report.id}-${to}-${report.updatedAt.getTime()}`,
  })

  await db.insert(reportSends).values({
    reportId: report.id,
    userId: user.id,
    toEmail: to,
    subject,
    status: result.ok ? 'sent' : 'failed',
    providerId: result.ok ? result.id : null,
    error: result.ok ? null : result.error.slice(0, 500),
  })

  if (!result.ok) {
    refresh(id)
    return { ok: false, error: result.error }
  }

  const now = new Date()
  await db
    .update(reports)
    .set({ status: 'sent', sentAt: now, recipientEmail: to, updatedAt: now })
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
  await logActivity(user.id, { action: 'report.sent', summary: `Emailed "${report.title}" to ${to}`, clientSlug: report.clientSlug })
  refresh(id)
  return { ok: true, message: `Sent to ${to}` }
}

export async function deleteReport(id: number, redirectToList = false) {
  const user = await getSessionUser()
  const report = await getReport(user.id, id)
  if (!report) return
  await db.delete(reportSends).where(and(eq(reportSends.reportId, id), eq(reportSends.userId, user.id)))
  await db.delete(reports).where(and(eq(reports.id, id), eq(reports.userId, user.id)))
  await logActivity(user.id, { action: 'report.deleted', summary: `Deleted report "${report.title}"`, clientSlug: report.clientSlug })
  refresh()
  if (redirectToList) redirect('/reports')
}
