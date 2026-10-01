import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getClientBySlug } from '@/lib/workspace'
import { getReport, reportFileName } from '@/lib/reports'
import { REPORT_STATUS_LABEL } from '@/lib/report-status'
import { renderReportPdf } from '@/lib/report-pdf'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const report = await getReport(session.user.id, Number(id))
  if (!report) return new Response('Not found', { status: 404 })
  const client = await getClientBySlug(session.user.id, report.clientSlug)
  if (!client) return new Response('Not found', { status: 404 })

  const pdf = await renderReportPdf({
    client,
    adviserName: session.user.name,
    title: report.title,
    status: REPORT_STATUS_LABEL[report.status],
    coverNote: report.coverNote,
    letter: report.letter,
    reference: `AR-${client.initials}-${report.id}`,
    issuedOn: (report.approvedAt ?? report.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  })

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportFileName(client.name, report.id)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
