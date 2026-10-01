import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { PageContainer } from '@/components/shell/page-header'
import { StatusBadge } from '@/components/clients/status-badge'
import { ClientTabs } from '@/components/clients/client-tabs'
import { AskAdviserButton } from '@/components/adviser/ask-adviser-button'
import { gbp } from '@/lib/data'
import { getClientBySlug, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Client' }

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const client = await getClientBySlug(user.id, id)
  if (!client) notFound()

  return (
    <PageContainer>
      <div>
        <Link href="/clients" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft aria-hidden className="size-3.5" /> Clients
        </Link>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-xl text-primary-foreground">
              {client.initials}
            </span>
            <div>
              <h1 className="font-serif text-3xl font-medium tracking-tight">{client.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">{gbp(client.portfolioValue)} portfolio</span>
                <span aria-hidden>·</span>
                <span>
                  {client.risk.label} Risk · {client.risk.score}/10
                </span>
                <StatusBadge status={client.status} />
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AskAdviserButton prompt={`Prepare ${client.firstName}'s annual review`} variant="default" size="default">
              Prepare Review
            </AskAdviserButton>
            <AskAdviserButton prompt={`Prepare ${client.firstName}'s client brief`} size="default">
              Generate Client Brief
            </AskAdviserButton>
            <AskAdviserButton prompt={`Draft ${client.firstName}'s review letter`} size="default">
              Draft Letter
            </AskAdviserButton>
          </div>
        </div>
      </div>
      <ClientTabs client={client} />
    </PageContainer>
  )
}
