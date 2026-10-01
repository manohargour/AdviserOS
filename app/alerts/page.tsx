import Link from 'next/link'
import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { cn } from '@/lib/utils'
import { alerts } from '@/lib/data'

export const metadata: Metadata = { title: 'Alerts' }

const tone = {
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/50',
}

export default function AlertsPage() {
  return (
    <PageContainer>
      <PageHeader title="Alerts" description="Detected by AdviserOS across your connected systems" />
      <ul className="divide-y rounded-xl border bg-card">
        {alerts.map((a) => {
          const inner = (
            <>
              <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', tone[a.severity])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.client} · <span className="capitalize">{a.severity}</span> priority
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </>
          )
          return (
            <li key={a.id}>
              {a.clientId ? (
                <Link href={`/clients/${a.clientId}`} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
                  {inner}
                </Link>
              ) : (
                <div className="flex gap-3 px-4 py-3">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </PageContainer>
  )
}
