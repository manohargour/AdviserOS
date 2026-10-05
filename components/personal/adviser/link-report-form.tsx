'use client'

import { useActionState } from 'react'
import { CheckCircle2, Link2, Loader2 } from 'lucide-react'
import { linkAdviserReport, type LinkState } from '@/app/actions/personal'
import { cn } from '@/lib/utils'

export function LinkReportForm({ defaultLink = '' }: { defaultLink?: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(linkAdviserReport, null)

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="report-link" className="text-[13px] font-medium">
        Report link from your adviser&apos;s email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="report-link"
            name="link"
            required
            defaultValue={defaultLink}
            placeholder="https://…/ack/…"
            className="h-10 w-full rounded-lg border bg-card pr-3 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring/50 focus:ring-3 focus:ring-ring/15"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Add report
        </button>
      </div>
      {state ? (
        <p
          role={state.ok ? 'status' : 'alert'}
          className={cn('flex items-center gap-1.5 text-[13px]', state.ok ? 'text-positive' : 'text-destructive')}
        >
          {state.ok ? <CheckCircle2 className="size-4" aria-hidden /> : null}
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
