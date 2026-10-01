'use client'

import Link from 'next/link'
import { useOptimistic, useTransition } from 'react'
import { X } from 'lucide-react'
import { dismissAlert } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'

type AlertItem = {
  id: number
  title: string
  client: string
  clientSlug: string | null
  severity: 'high' | 'medium' | 'low'
  time: string
}

const tone = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/50',
}

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  const [, startTransition] = useTransition()
  const [optimistic, removeOptimistic] = useOptimistic(alerts, (state, id: number) => state.filter((a) => a.id !== id))

  if (optimistic.length === 0) {
    return (
      <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        You&apos;re all caught up. No open alerts.
      </p>
    )
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {optimistic.map((a) => {
        const inner = (
          <>
            <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', tone[a.severity])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.client} · <span className="capitalize">{a.severity}</span> priority · {a.time}
              </p>
            </div>
          </>
        )
        return (
          <li key={a.id} className="flex items-start gap-2 pr-3 hover:bg-muted/40">
            {a.clientSlug ? (
              <Link href={`/clients/${a.clientSlug}`} className="flex min-w-0 flex-1 gap-3 px-4 py-3">
                {inner}
              </Link>
            ) : (
              <div className="flex min-w-0 flex-1 gap-3 px-4 py-3">{inner}</div>
            )}
            <button
              type="button"
              aria-label={`Dismiss alert: ${a.title}`}
              onClick={() =>
                startTransition(async () => {
                  removeOptimistic(a.id)
                  await dismissAlert(a.id)
                })
              }
              className="mt-2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
