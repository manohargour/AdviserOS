import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { clients, reportSends, reports } from '@/lib/db/schema'

export type Report = typeof reports.$inferSelect
export type ReportSend = typeof reportSends.$inferSelect

export async function getReports(userId: string) {
  return db
    .select({
      id: reports.id,
      title: reports.title,
      status: reports.status,
      clientSlug: reports.clientSlug,
      clientName: clients.name,
      recipientEmail: reports.recipientEmail,
      sentAt: reports.sentAt,
      updatedAt: reports.updatedAt,
    })
    .from(reports)
    .leftJoin(clients, and(eq(clients.userId, reports.userId), eq(clients.slug, reports.clientSlug)))
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.updatedAt), desc(reports.id))
}

export async function getReport(userId: string, id: number) {
  if (!Number.isInteger(id) || id <= 0) return null
  const [row] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function getReportSends(userId: string, reportId: number) {
  return db
    .select()
    .from(reportSends)
    .where(and(eq(reportSends.reportId, reportId), eq(reportSends.userId, userId)))
    .orderBy(desc(reportSends.createdAt))
}

export function reportFileName(clientName: string, id: number) {
  return `Annual-Review-${clientName.replace(/[^a-z0-9]+/gi, '-')}-${id}.pdf`
}
