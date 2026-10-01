'use client'

import { useState, useTransition } from 'react'
import { Check, Download, Loader2, Mail, Pencil, Printer, RotateCcw, Send, ShieldCheck, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { deleteReport, sendReport, transitionReport, updateReport } from '@/app/actions/reports'
import { REPORT_STEPS, isEditable, type ReportStatus } from '@/lib/report-status'
import { ReportStatusBadge } from '@/components/reports/report-status-badge'
import { cn } from '@/lib/utils'

type ReportData = {
  id: number
  title: string
  status: ReportStatus
  coverNote: string
  letter: string
  recipientEmail: string
  submittedAt: string | null
  approvedAt: string | null
  sentAt: string | null
}

type Send = { id: number; toEmail: string; status: 'sent' | 'failed'; error: string | null; createdAt: string }

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ReportWorkflow({
  report,
  clientName,
  clientFirstName,
  adviserName,
  emailConfigured,
  sends,
}: {
  report: ReportData
  clientName: string
  clientFirstName: string
  adviserName: string
  emailConfigured: boolean
  sends: Send[]
}) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    title: report.title,
    coverNote: report.coverNote,
    letter: report.letter,
    recipientEmail: report.recipientEmail,
  })
  const [email, setEmail] = useState({
    to: report.recipientEmail,
    subject: `Your annual review report — ${clientName}`,
    message: `Dear ${clientFirstName},\n\nPlease find attached your annual review report. Do let me know if you have any questions before we meet.\n\nKind regards,\n${adviserName}`,
  })

  const editable = isEditable(report.status)
  const canSend = report.status === 'approved' || report.status === 'sent'
  const currentIndex = REPORT_STEPS.findIndex((s) => s.status === report.status)
  const stamps: Record<ReportStatus, string | null> = {
    draft: null,
    in_review: fmt(report.submittedAt),
    approved: fmt(report.approvedAt),
    sent: fmt(report.sentAt),
  }

  function run(fn: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>, after?: () => void) {
    setFeedback(null)
    startTransition(async () => {
      const result = await fn()
      if (result.ok) {
        if (result.message) setFeedback({ tone: 'ok', text: result.message })
        after?.()
      } else setFeedback({ tone: 'error', text: result.error })
    })
  }

  return (
    <section aria-labelledby="workflow-title" className="space-y-5 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 id="workflow-title" className="font-serif text-2xl font-medium tracking-tight">
              {clientName}
            </h1>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{report.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/reports/${report.id}/pdf`} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <Download aria-hidden /> Download PDF
          </a>
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Printer aria-hidden /> Print
          </Button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <Button
                variant="destructive"
                size="lg"
                disabled={pending}
                onClick={() => startTransition(() => deleteReport(report.id, true))}
              >
                {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />} Confirm delete
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="lg" aria-label="Delete report" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Report workflow">
        {REPORT_STEPS.map((step, i) => {
          const done = i < currentIndex || (report.status === 'sent' && i === currentIndex)
          const current = i === currentIndex && report.status !== 'sent'
          return (
            <li
              key={step.status}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border px-3 py-2.5',
                current && 'border-primary bg-primary/5',
                done && 'bg-muted/50',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-positive bg-positive text-white',
                  current && 'border-primary text-primary',
                )}
              >
                {done ? <Check aria-hidden className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{step.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {stamps[step.status] ?? (current ? 'Current step' : done ? 'Done' : 'Pending')}
                </span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {editable && (
          <Button variant="outline" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            <Pencil aria-hidden /> {editing ? 'Close editor' : 'Edit report'}
          </Button>
        )}
        {report.status === 'draft' && (
          <Button disabled={pending} onClick={() => run(() => transitionReport(report.id, 'submit'))}>
            <Send aria-hidden /> Submit for review
          </Button>
        )}
        {report.status === 'in_review' && (
          <Button disabled={pending} onClick={() => run(() => transitionReport(report.id, 'approve'))}>
            <ShieldCheck aria-hidden /> Approve report
          </Button>
        )}
        {report.status !== 'draft' && (
          <Button variant="ghost" disabled={pending} onClick={() => run(() => transitionReport(report.id, 'reopen'))}>
            <RotateCcw aria-hidden /> Back to draft
          </Button>
        )}
        {pending && <Loader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />}
        <p
          role="status"
          className={cn('text-sm', feedback?.tone === 'error' ? 'text-destructive' : 'text-positive')}
        >
          {feedback?.text}
        </p>
        {!editable && (
          <p className="ml-auto text-xs text-muted-foreground">Move back to draft to make changes.</p>
        )}
      </div>

      {editable && editing && (
        <form
          className="grid gap-4 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(() => updateReport(report.id, form))
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="r-title" className="text-sm font-medium">Title</label>
              <input id="r-title" className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="r-email" className="text-sm font-medium">Client email</label>
              <input
                id="r-email"
                type="email"
                className={inputCls}
                placeholder="client@example.com"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="r-cover" className="text-sm font-medium">Cover note</label>
            <textarea id="r-cover" rows={4} className={inputCls} value={form.coverNote} onChange={(e) => setForm({ ...form, coverNote: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="r-letter" className="text-sm font-medium">Covering letter</label>
            <textarea id="r-letter" rows={10} className={cn(inputCls, 'font-serif leading-relaxed')} value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />} Save changes
            </Button>
          </div>
        </form>
      )}

      {canSend && (
        <form
          className="grid gap-4 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(() => sendReport(report.id, email))
          }}
        >
          <div className="flex items-center gap-2">
            <Mail aria-hidden className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{report.status === 'sent' ? 'Send again' : 'Email to client'}</h2>
            <span className="text-xs text-muted-foreground">The PDF is attached automatically.</span>
          </div>
          {!emailConfigured && (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              Email isn&apos;t connected yet. Connect Resend in Integrations to send. You can still download or print the PDF.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="e-to" className="text-sm font-medium">To</label>
              <input id="e-to" type="email" required className={inputCls} placeholder="client@example.com" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="e-subject" className="text-sm font-medium">Subject</label>
              <input id="e-subject" className={inputCls} value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="e-msg" className="text-sm font-medium">Message</label>
            <textarea id="e-msg" rows={6} className={inputCls} value={email.message} onChange={(e) => setEmail({ ...email, message: e.target.value })} />
          </div>
          <div>
            <Button type="submit" disabled={pending || !emailConfigured}>
              {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />} Send report
            </Button>
          </div>
        </form>
      )}

      {sends.length > 0 && (
        <div className="border-t pt-4">
          <h2 className="text-sm font-semibold">Email history</h2>
          <ul className="mt-2 divide-y text-sm">
            {sends.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {s.toEmail}
                  {s.error && <span className="block text-xs text-destructive">{s.error}</span>}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={s.status === 'sent' ? 'text-positive' : 'text-destructive'}>
                    {s.status === 'sent' ? 'Delivered to Resend' : 'Failed'}
                  </span>
                  {fmt(s.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
