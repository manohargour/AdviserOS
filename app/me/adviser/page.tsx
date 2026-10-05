import type { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { reportAcknowledgements, reports, user as users } from '@/lib/db/schema'
import { requirePersonal } from '@/lib/roles'
import { PageHeader } from '@/components/personal/wealth/primitives'
import { LinkReportForm } from '@/components/personal/adviser/link-report-form'

export const metadata: Metadata = { title: 'My adviser' }

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function MyAdviserPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const me = await requirePersonal()
  const { link } = await searchParams

  const linked = await db
    .select({
      id: reportAcknowledgements.id,
      token: reportAcknowledgements.token,
      acknowledgedAt: reportAcknowledgements.acknowledgedAt,
      createdAt: reportAcknowledgements.createdAt,
      title: reports.title,
      sentAt: reports.sentAt,
      adviserName: users.name,
    })
    .from(reportAcknowledgements)
    .leftJoin(reports, eq(reports.id, reportAcknowledgements.reportId))
    .leftJoin(users, eq(users.id, reportAcknowledgements.userId))
    .where(eq(reportAcknowledgements.personalUserId, me.id))
    .orderBy(desc(reportAcknowledgements.createdAt))

  const adviserName = linked.find((r) => r.adviserName)?.adviserName

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Connected advice"
        title="My adviser"
        description={
          adviserName
            ? `Reviews and reports from ${adviserName}, kept alongside your own picture.`
            : 'Work with a financial adviser? Bring their reviews into your account.'
        }
      />

      {linked.length > 0 ? (
        <section aria-labelledby="reports-heading" className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="reports-heading" className="text-[14px] font-semibold">
              Reports
            </h2>
            <span className="num text-[12px] text-muted-foreground">{linked.length} linked</span>
          </div>
          <ul className="divide-y">
            {linked.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{r.title ?? 'Annual Review Report'}</p>
                  <p className="text-[12px] text-muted-foreground">
                    Sent {fmt(r.sentAt ?? r.createdAt)}
                    {r.adviserName ? ` by ${r.adviserName}` : ''}
                  </p>
                </div>
                {r.acknowledgedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2.5 py-1 text-[12px] font-medium text-positive">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    Signed off {fmt(r.acknowledgedAt)}
                  </span>
                ) : (
                  <Link
                    href={`/ack/${r.token}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium hover:bg-muted"
                  >
                    <Clock className="size-3.5 text-warning" aria-hidden />
                    Review and sign off
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="link-heading" className="grid gap-6 rounded-xl border bg-card p-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 id="link-heading" className="text-[14px] font-semibold">
            {linked.length > 0 ? 'Add another report' : 'Connect your adviser'}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground text-pretty">
            When your adviser emails your annual review, it includes a sign-off link. Paste it here to keep the report in
            your account.
          </p>
          <p className="mt-3 flex items-start gap-2 text-[12px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden />
            Only someone with the link from that email can add the report, so your adviser&apos;s reports stay private.
          </p>
        </div>
        <div className="lg:col-span-3">
          <LinkReportForm defaultLink={link ?? ''} />
        </div>
      </section>
    </div>
  )
}
