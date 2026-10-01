import type { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/shell/page-header'
import { ADVISER } from '@/lib/data'

export const metadata: Metadata = { title: 'Settings' }

const rules = [
  ['AdviserOS drafts advice', 'Never — recommendations are always written by the adviser'],
  ['Client-facing documents', 'Require adviser approval before sending'],
  ['Source citations', 'Shown for every number AdviserOS uses'],
  ['Audit log', 'All AdviserOS actions recorded for compliance'],
]

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description={`${ADVISER.name} · ${ADVISER.firm}`} />
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">AdviserOS guardrails</h2>
        <dl className="mt-3 divide-y">
          {rules.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
              <dt className="text-sm font-medium">{k}</dt>
              <dd className="text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Time saved this month</h2>
        <p className="mt-2 font-serif text-4xl tabular-nums">31 hrs</p>
        <p className="text-sm text-muted-foreground">Across 22 reviews, 14 client briefs and 9 letters.</p>
      </section>
    </PageContainer>
  )
}
