import Link from 'next/link'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { cn } from '@/lib/utils'
import { clients, getClient } from '@/lib/data'

export const metadata: Metadata = { title: 'Documents' }

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientId } = await searchParams
  const selected = clientId ? getClient(clientId) : undefined
  const docs = (selected ? [selected] : clients).flatMap((c) => c.documents.map((d) => ({ ...d, client: c.name })))

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description={selected ? `Source documents for ${selected.name}` : 'Indexed from SharePoint, platforms and risk tools'}
      />
      <nav aria-label="Filter by client" className="flex flex-wrap gap-1.5">
        <Link
          href="/documents"
          className={cn('rounded-full border px-3 py-1 text-xs', !selected ? 'bg-primary text-primary-foreground' : 'bg-card')}
        >
          All clients
        </Link>
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/documents?client=${c.id}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              selected?.id === c.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
            )}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <ul className="divide-y rounded-xl border bg-card">
        {docs.map((d) => (
          <li key={d.client + d.name} className="flex items-center gap-3 px-4 py-3">
            <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.client} · {d.type} · {d.source}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{d.date}</span>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
