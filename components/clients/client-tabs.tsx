import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AllocationBar } from './allocation-bar'
import { allocation, equityPct, gbp, type Client } from '@/lib/data'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Overview({ client }: { client: Client }) {
  const facts = [
    ['Age', `${client.age}`],
    ['Occupation', client.occupation],
    ['Last review', client.lastReview],
    ['Next review', client.nextReview],
    ['Risk tool', client.risk.tool],
    ['Equity allocation', `${equityPct(client).toFixed(0)}%`],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Changes since last review">
          {client.changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No material changes.</p>
          ) : (
            <ul className="divide-y">
              {client.changes.map((c) => (
                <li key={c.id} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">Source: {c.source}</p>
                  </div>
                  {c.from ? (
                    <p className="flex items-center gap-1.5 text-sm tabular-nums">
                      {c.from} <ArrowRight aria-label="to" className="size-3 text-muted-foreground" /> {c.to}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground sm:max-w-[50%] sm:text-right">{c.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Adviser notes">
          <ul className="space-y-3">
            {client.notes.map((n) => (
              <li key={n.date + n.text} className="border-l-2 border-brass/50 pl-3">
                <p className="text-sm leading-relaxed">{n.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {n.author} · {n.date}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Key facts">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Outstanding">
          {client.outstanding.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {client.outstanding.map((o) => (
                <li key={o.id} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                  {o.title}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function Portfolio({ client }: { client: Client }) {
  return (
    <div className="space-y-4">
      <Card title="Asset allocation">
        <AllocationBar rows={allocation(client)} />
      </Card>
      <Card title="Holdings">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="px-4 pb-2 font-medium">Fund</th>
                <th scope="col" className="hidden px-4 pb-2 font-medium sm:table-cell">Asset class</th>
                <th scope="col" className="hidden px-4 pb-2 font-medium md:table-cell">Platform</th>
                <th scope="col" className="px-4 pb-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {client.holdings.map((h) => (
                <tr key={h.name}>
                  <td className="px-4 py-2.5">{h.name}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">{h.assetClass}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{h.platform}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{gbp(h.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="px-4 pt-2.5">Total</td>
                <td className="hidden sm:table-cell" />
                <td className="hidden md:table-cell" />
                <td className="px-4 pt-2.5 text-right tabular-nums">{gbp(client.portfolioValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Goals({ client }: { client: Client }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {client.goals.map((g) => (
        <li key={g.title} className="rounded-xl border bg-card p-4">
          <p className="font-medium">{g.title}</p>
          <p className="text-sm text-muted-foreground">
            {g.target} · {g.horizon}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${g.progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{g.progress}% on track</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Reviews({ client }: { client: Client }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Upcoming review">
        <p className="font-serif text-2xl">{client.nextReview}</p>
        <p className="mt-1 text-sm text-muted-foreground">{client.reviewReadiness}% prepared by AdviserOS</p>
        <Link href={`/reviews/${client.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Open review workspace <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </Card>
      <Card title="Previous review">
        <p className="font-serif text-2xl">{client.lastReview}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Portfolio {gbp(client.previousValue)} · {client.previousEquityPct}% equity · Risk {client.risk.previousScore}/10
        </p>
      </Card>
    </div>
  )
}

function Documents({ client }: { client: Client }) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {client.documents.map((d) => (
        <li key={d.name} className="flex items-center gap-3 px-4 py-3">
          <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.name}</p>
            <p className="text-xs text-muted-foreground">
              {d.type} · {d.source}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{d.date}</span>
        </li>
      ))}
    </ul>
  )
}

function Activity({ client }: { client: Client }) {
  return (
    <ol className="space-y-4 rounded-xl border bg-card p-4">
      {client.activity.map((a) => (
        <li key={a.date + a.text} className="flex gap-4">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">{a.date}</span>
          <span className="text-sm">{a.text}</span>
        </li>
      ))}
    </ol>
  )
}

const tabs = [
  { value: 'overview', label: 'Overview', Panel: Overview },
  { value: 'portfolio', label: 'Portfolio', Panel: Portfolio },
  { value: 'goals', label: 'Goals', Panel: Goals },
  { value: 'reviews', label: 'Reviews', Panel: Reviews },
  { value: 'documents', label: 'Documents', Panel: Documents },
  { value: 'activity', label: 'Activity', Panel: Activity },
]

export function ClientTabs({ client }: { client: Client }) {
  return (
    <Tabs defaultValue="overview" className="gap-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <TabsList variant="line" className="border-b">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-3">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map(({ value, Panel }) => (
        <TabsContent key={value} value={value}>
          <Panel client={client} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
