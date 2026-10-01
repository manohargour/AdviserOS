'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, Mail, Send, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { emailReviewReport } from '@/app/actions/reports'

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

type Props = {
  clientSlug: string
  approved: boolean
  defaultTo: string
  defaultSubject: string
  defaultMessage: string
}

export function EmailReportButton({ clientSlug, approved, defaultTo, defaultSubject, defaultMessage }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState({ to: defaultTo, subject: defaultSubject, message: defaultMessage })
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function open() {
    setStatus(null)
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await emailReviewReport(clientSlug, form)
      setStatus(res.ok ? { ok: true, text: res.message ?? 'Sent' } : { ok: false, text: res.error })
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={open}>
        <Mail aria-hidden /> Email to client
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="email-report-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-foreground/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id="email-report-title" className="text-base font-semibold">
              Email report to client
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">The branded PDF is attached automatically.</p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X aria-hidden className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {approved ? (
          <form onSubmit={submit} className="space-y-4 px-5 py-4">
            <div className="space-y-1.5">
              <label htmlFor="er-to" className="text-sm font-medium">To</label>
              <input
                id="er-to"
                type="email"
                required
                className={inputCls}
                placeholder="client@example.com"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="er-subject" className="text-sm font-medium">Subject</label>
              <input id="er-subject" className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="er-message" className="text-sm font-medium">Message</label>
              <textarea id="er-message" rows={5} className={inputCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>

            {status && (
              <p role="status" className={status.ok ? 'text-sm text-emerald-700' : 'text-sm text-destructive'}>
                {status.text}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                {status?.ok ? 'Done' : 'Cancel'}
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
                {pending ? 'Sending…' : 'Send email'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              This review hasn&apos;t been approved yet. Reports can only be sent to clients after approval, so there&apos;s a clear compliance record.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Link href={`/reviews/${clientSlug}`} className={buttonVariants({ size: 'sm' })}>
                Go to review to approve
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
