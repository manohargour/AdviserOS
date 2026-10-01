import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Integrations' }

const available = [
  { name: 'Intelliflo Office', category: 'Back office' },
  { name: 'Quilter Platform', category: 'Investment platform' },
  { name: 'FinaMetrica', category: 'Risk profiling' },
  { name: 'Microsoft Outlook', category: 'Calendar & email' },
  { name: 'Voyant', category: 'Cashflow planning' },
  { name: 'Morningstar', category: 'Fund research' },
]

export default function IntegrationsPage() {
  return (
    <PageContainer>
      <PageHeader title="Integrations" description="Connect more systems to give AdviserOS fuller context" />
      <ul className="divide-y rounded-xl border bg-card">
        {available.map((i) => (
          <li key={i.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">{i.category}</p>
            </div>
            <Button variant="outline" size="sm">
              Connect
            </Button>
          </li>
        ))}
      </ul>
    </PageContainer>
  )
}
