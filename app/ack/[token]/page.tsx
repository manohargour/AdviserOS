import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { CheckCircle2, FileText } from 'lucide-react'
import { db } from '@/lib/db'
import { reportAcknowledgements, reports } from '@/lib/db/schema'
import { getClientBySlug } from '@/lib/workspace'
import { ADVISER } from '@/lib/data'
import { AcknowledgeForm } from '@/components/ack/acknowledge-form'

export const metadata: Metadata = { title: 'Confirm receipt of your report', robots: { index: false, follow: false } }

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function AcknowledgePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound()

  const [ack] = await db
    .select({
      userId: reportAcknowledgements.userId,
      clientSlug: reportAcknowledgements.clientSlug,
      acknowledgedAt: reportAcknowledgements.acknowledgedAt,
      acknowledgedName: reportAcknowledgements.acknowledgedName,
      createdAt: reportAcknowledgements.createdAt,
      title: reports.title,
      sentAt: reports.sentAt,
    })
    .from(reportAcknowledgements)
    .leftJoin(reports, eq(reports.id, reportAcknowledgements.reportId))
    .where(eq(reportAcknowledgements.token, token))
    .limit(1)
  if (!ack) notFound()
  const client = await getClientBySlug(ack.userId, ack.clientSlug)

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <header className="bg-[#1f2a3c] px-6 py-5 text-white">
          <p className="text-base font-semibold">{ADVISER.firm}</p>
          <p className="text-xs text-white/70">Independent financial advice</p>
        </header>

        <div className="space-y-5 px-6 py-6">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-pretty">{ack.title ?? 'Annual Review Report'}</p>
              <p className="text-xs text-muted-foreground">Sent {fmt(ack.sentAt ?? ack.createdAt)}</p>
            </div>
          </div>

          {ack.acknowledgedAt ? (
            <div className="space-y-2 text-center">
              <CheckCircle2 aria-hidden className="mx-auto size-10 text-emerald-600" />
              <h1 className="text-lg font-semibold">Thank you{ack.acknowledgedName ? `, ${ack.acknowledgedName.split(' ')[0]}` : ''}</h1>
              <p className="text-sm text-muted-foreground">
                You confirmed receipt on {fmt(ack.acknowledgedAt)}. Your adviser has been notified. There&apos;s nothing else you need to do.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-balance">Confirm you&apos;ve received your report</h1>
                <p className="text-sm text-muted-foreground">
                  This lets us keep a record that your annual review has been delivered. It doesn&apos;t change any of your investments.
                </p>
              </div>
              <AcknowledgeForm token={token} defaultName={client?.name ?? ''} />
            </>
          )}
        </div>
        <footer className="border-t border-border bg-muted/40 px-6 py-3 text-center text-xs text-muted-foreground">
          Have a personal AdviserOS account?{' '}
          <Link href={`/sign-up?as=client&link=${token}`} className="font-medium text-foreground underline underline-offset-4">
            Keep this report in it
          </Link>
        </footer>
      </div>
    </main>
  )
}
