import Link from 'next/link'
import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { StatusBadge } from '@/components/clients/status-badge'
import { gbp } from '@/lib/data'
import { getClients, requireUser } from '@/lib/workspace'

export const metadata: Metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const user = await requireUser()
  const clients = await getClients(user.id)

  return (
    <PageContainer>
      <PageHeader title="Clients" description={`${clients.length} clients in your book · showing those with recent activity`} />
      {clients.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No clients yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Client</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Portfolio</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Risk</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Next review</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">
                        {client.initials}
                      </span>
                      <span>
                        {client.name}
                        <span className="block text-xs font-normal text-muted-foreground">{client.occupation}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{gbp(client.portfolioValue)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {client.risk.label} · {client.risk.score}/10
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{client.nextReview}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  )
}
