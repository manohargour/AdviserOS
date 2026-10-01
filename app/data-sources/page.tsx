import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { dataSources } from '@/lib/data'

export const metadata: Metadata = { title: 'Data Sources' }

export default function DataSourcesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Data Sources"
        description="Your existing systems remain the systems of record. Copilot reads from them, never replaces them."
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dataSources.map((s) => (
          <li key={s.name} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-medium text-positive">
                <span aria-hidden className="size-1.5 rounded-full bg-positive" />
                {s.status}
              </span>
            </div>
            <dl className="mt-4 flex justify-between text-xs">
              <div>
                <dt className="text-muted-foreground">Records</dt>
                <dd className="font-medium tabular-nums">{s.records}</dd>
              </div>
              <div className="text-right">
                <dt className="text-muted-foreground">Last sync</dt>
                <dd className="font-medium">{s.synced}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
