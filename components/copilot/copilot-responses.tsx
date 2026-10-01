'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check, Database, FileText, Link2, TriangleAlert } from 'lucide-react'
import { buttonVariants, Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CopilotPlan } from '@/lib/copilot-engine'
import { alerts, clients, equityPct, equityValue, gbp, getClient, reviewsDue, type Client } from '@/lib/data'
import { useCopilot, useReviewProgress } from './copilot-provider'

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2">{children}</div>
}

function ActionLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  const { setPanelOpen } = useCopilot()
  return (
    <Link
      href={href}
      onClick={() => setPanelOpen(false)}
      className={cn(buttonVariants({ variant: primary ? 'default' : 'outline', size: 'sm' }), 'h-7')}
    >
      {children}
    </Link>
  )
}

function ActionPrompt({ prompt, children, primary }: { prompt: string; children: React.ReactNode; primary?: boolean }) {
  const { send, isWorking } = useCopilot()
  return (
    <Button size="sm" variant={primary ? 'default' : 'outline'} disabled={isWorking} onClick={() => send(prompt)}>
      {children}
    </Button>
  )
}

function ActionToggle({ label, doneLabel }: { label: string; doneLabel: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button size="sm" variant="outline" onClick={() => setDone(true)} disabled={done} aria-live="polite">
      {done && <Check aria-hidden className="text-positive" />}
      {done ? doneLabel : label}
    </Button>
  )
}

function SourceLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
      <Database aria-hidden className="size-3" />
      {children}
    </p>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-foreground">{children}</p>
}

function ReviewPrepared({ client }: { client: Client }) {
  const { readiness, remaining } = useReviewProgress(client)
  return (
    <div>
      <Heading>
        {client.firstName}&apos;s annual review is {readiness}% prepared.
      </Heading>
      <p className="mt-1 text-muted-foreground">
        {remaining === 0
          ? 'All items have been confirmed. Ready for your final approval.'
          : `${remaining} ${remaining === 1 ? 'item requires' : 'items require'} your confirmation.`}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness}%` }} />
      </div>
      <Actions>
        <ActionLink href={`/reviews/${client.id}`} primary>
          Open Review
        </ActionLink>
        <ActionLink href={`/reviews/${client.id}#outstanding`}>Show Outstanding Items</ActionLink>
      </Actions>
    </div>
  )
}

function Changes({ client }: { client: Client }) {
  return (
    <div>
      <Heading>Changes detected</Heading>
      {client.changes.length === 0 ? (
        <p className="mt-1 text-muted-foreground">No material changes since the last review.</p>
      ) : (
        <dl className="mt-2 divide-y divide-border rounded-lg border bg-background">
          {client.changes.map((change) => (
            <div key={change.id} className="px-3 py-2.5">
              <dt className="text-xs font-medium text-muted-foreground">{change.title}</dt>
              <dd className="mt-0.5">
                {change.from ? (
                  <span className="flex flex-wrap items-baseline gap-x-2 font-medium tabular-nums">
                    {change.from} <ArrowRight aria-label="to" className="size-3 self-center text-muted-foreground" />
                    {change.to}
                    {change.delta && <span className="text-xs text-positive">{change.delta}</span>}
                  </span>
                ) : (
                  <span>{change.detail}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <Actions>
        {client.id === 'john-smith' && (
          <ActionPrompt prompt="Where did the 69% equity number come from?">View sources</ActionPrompt>
        )}
        <ActionToggle label="Add to Report" doneLabel="Added to report" />
      </Actions>
    </div>
  )
}

function EquitySource({ client }: { client: Client }) {
  const platform = client.holdings[0]?.platform ?? 'Investment platform'
  return (
    <div>
      <Heading>Source</Heading>
      <div className="mt-2 rounded-lg border bg-background p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText aria-hidden className="size-3.5" /> {platform} · Investment Platform
        </p>
        <p className="mt-0.5 font-medium">Portfolio Export — September 2026</p>
        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs tabular-nums">
          <dt className="text-muted-foreground">Equity holdings</dt>
          <dd className="text-right font-medium">{gbp(equityValue(client))}</dd>
          <dt className="text-muted-foreground">Total portfolio</dt>
          <dd className="text-right font-medium">{gbp(client.portfolioValue)}</dd>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t pt-2">
          <span className="text-xs text-muted-foreground">Calculated equity allocation</span>
          <span className="font-serif text-xl font-medium tabular-nums">{equityPct(client).toFixed(1)}%</span>
        </div>
      </div>
      <Actions>
        <ActionLink href={`/documents?client=${client.id}`}>
          <Link2 aria-hidden /> Open Source
        </ActionLink>
        <ActionToggle label="Mark Reviewed" doneLabel="Reviewed" />
      </Actions>
    </div>
  )
}

function RiskSource({ client }: { client: Client }) {
  return (
    <div>
      <Heading>
        Risk score: {client.risk.label} · {client.risk.score}/10
      </Heading>
      <div className="mt-2 rounded-lg border bg-background p-3 text-xs">
        <p className="font-medium text-muted-foreground">{client.risk.tool}</p>
        <p className="mt-0.5 text-sm font-medium">Risk Profile Questionnaire</p>
        <p className="mt-1 text-muted-foreground">Completed {client.risk.assessedOn} · 25 questions</p>
        <p className="mt-2">
          Previous score {client.risk.previousScore}/10.{' '}
          {client.risk.previousScore === client.risk.score ? 'Unchanged since last assessment.' : 'Score has changed.'}
        </p>
      </div>
      <Actions>
        <ActionLink href={`/documents?client=${client.id}`}>
          <Link2 aria-hidden /> View Source
        </ActionLink>
        <ActionToggle label="Mark Reviewed" doneLabel="Reviewed" />
      </Actions>
    </div>
  )
}

function EquityExplain({ client }: { client: Client }) {
  const now = equityPct(client)
  return (
    <div>
      <Heading>
        Equity moved from {client.previousEquityPct}% to {now.toFixed(0)}%
      </Heading>
      <p className="mt-1 text-muted-foreground">
        No trades or rebalancing were found in the platform transaction history. The increase is market drift: global
        equity funds returned around 11% while gilts were broadly flat.
      </p>
      <ul className="mt-2 space-y-1 text-xs">
        {client.holdings
          .filter((h) => h.assetClass === 'Equity')
          .map((h) => (
            <li key={h.name} className="flex justify-between gap-2 tabular-nums">
              <span className="text-muted-foreground">{h.name}</span>
              <span>{gbp(h.value)}</span>
            </li>
          ))}
      </ul>
      <p className="mt-3 flex gap-1.5 rounded-md bg-warning-soft p-2 text-xs text-foreground">
        <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-warning" />
        Above the Moderate 5/10 model range of 55–65%. Suitability judgement required.
      </p>
      <Actions>
        <ActionToggle label="Add to Report" doneLabel="Added to report" />
        <ActionPrompt prompt="Where did the 69% equity number come from?">View Source</ActionPrompt>
      </Actions>
    </div>
  )
}

function Attention({ client }: { client: Client }) {
  const { confirmed, setConfirmed } = useCopilot()
  return (
    <div>
      <Heading>
        {client.outstanding.length} {client.outstanding.length === 1 ? 'item needs' : 'items need'} your judgement
      </Heading>
      <ol className="mt-2 space-y-2">
        {client.outstanding.map((item, i) => (
          <li key={item.id} className="rounded-lg border bg-background p-2.5">
            <p className="font-medium">
              {i + 1}. {item.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
            <div className="mt-2">
              {item.kind === 'client' ? (
                <ActionToggle label="Request Client Confirmation" doneLabel="Request sent" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmed(item.id, true)}
                  disabled={confirmed[item.id]}
                >
                  {confirmed[item.id] && <Check aria-hidden className="text-positive" />}
                  {confirmed[item.id] ? 'Reviewed' : 'Mark Reviewed'}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <Actions>
        <ActionLink href={`/reviews/${client.id}#outstanding`}>Open in Review</ActionLink>
      </Actions>
    </div>
  )
}

function Letter({ client }: { client: Client }) {
  return (
    <div>
      <Heading>Draft review letter ready</Heading>
      <div className="mt-2 rounded-lg border bg-background p-3 font-serif text-[13px] leading-relaxed">
        <p>Dear {client.firstName},</p>
        <p className="mt-2">
          Thank you for meeting with me for your annual review. Your portfolio is now valued at{' '}
          {gbp(client.portfolioValue)}, an increase of {gbp(client.portfolioValue - client.previousValue)} since we last
          met.
        </p>
        <p className="mt-2 text-muted-foreground">
          [Adviser to confirm recommendation on equity allocation before sending]
        </p>
      </div>
      <SourceLine>Built from 5 sources · firm template v3.2</SourceLine>
      <Actions>
        <ActionLink href={`/reviews/${client.id}#letter`} primary>
          Open Draft
        </ActionLink>
        <ActionToggle label="Generate Draft PDF" doneLabel="PDF generated" />
      </Actions>
    </div>
  )
}

function Missing({ client }: { client: Client }) {
  return (
    <div>
      <Heading>
        {client.missing.length === 0 ? 'Nothing missing' : `${client.missing.length} items missing`}
      </Heading>
      <ul className="mt-2 space-y-1.5">
        {client.missing.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
            {item}
          </li>
        ))}
      </ul>
      {client.missing.length > 0 && (
        <Actions>
          <ActionToggle label="Request Client Confirmation" doneLabel="Request sent" />
          <ActionToggle label="Add Task" doneLabel="Task added" />
        </Actions>
      )}
    </div>
  )
}

function Summary({ client }: { client: Client }) {
  return (
    <div>
      <Heading>{client.name} in brief</Heading>
      <p className="mt-1 text-muted-foreground">
        {client.age}, {client.occupation.toLowerCase()}. {gbp(client.portfolioValue)} portfolio, {client.risk.label}{' '}
        {client.risk.score}/10. Last reviewed {client.lastReview}.
      </p>
      {client.discussion.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Worth discussing</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {client.discussion.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}
      <Actions>
        <ActionLink href={`/clients/${client.id}`}>Open Client</ActionLink>
        <ActionPrompt prompt={`Prepare ${client.firstName}'s client brief`}>Generate Full Brief</ActionPrompt>
      </Actions>
    </div>
  )
}

function Brief({ client }: { client: Client }) {
  const sections: { title: string; items: string[] }[] = [
    {
      title: 'Current portfolio',
      items: [`${gbp(client.portfolioValue)} · ${client.risk.label} ${client.risk.score}/10 · ${equityPct(client).toFixed(0)}% equity`],
    },
    { title: 'Recent changes', items: client.changes.map((c) => (c.from ? `${c.title}: ${c.from} → ${c.to}` : c.detail)) },
    { title: 'Client goals', items: client.goals.map((g) => `${g.title} — ${g.target}`) },
    { title: 'Outstanding actions', items: client.outstanding.map((o) => o.title) },
    { title: 'Previous adviser notes', items: client.notes.map((n) => `${n.date}: ${n.text}`) },
    { title: 'Items worth discussing', items: client.discussion },
  ].filter((s) => s.items.length > 0)

  return (
    <div>
      <Heading>Client brief · {client.name}</Heading>
      {client.meeting && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {client.meeting.purpose} at {client.meeting.time}
        </p>
      )}
      <div className="mt-2 divide-y rounded-lg border bg-background">
        {sections.map((section) => (
          <section key={section.title} className="px-3 py-2">
            <h4 className="text-xs font-medium text-muted-foreground">{section.title}</h4>
            <ul className="mt-1 space-y-0.5">
              {section.items.map((item) => (
                <li key={item} className="text-[13px] leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Actions>
        <ActionLink href={`/clients/${client.id}`} primary>
          Open Client
        </ActionLink>
        <ActionToggle label="Save Brief to Documents" doneLabel="Saved" />
      </Actions>
    </div>
  )
}

function ReviewsWeek() {
  const week = reviewsDue.slice(0, 6)
  return (
    <div>
      <Heading>6 reviews due in the next 7 days</Heading>
      <p className="mt-1 text-muted-foreground">4 drafts are ready for your approval. 2 are waiting on data.</p>
      <ul className="mt-2 divide-y rounded-lg border bg-background">
        {week.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
            <span>
              <span className="font-medium">{r.name}</span>
              <span className="block text-xs text-muted-foreground">Due {r.due}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{r.readiness}%</span>
          </li>
        ))}
      </ul>
      <Actions>
        <ActionLink href="/reviews" primary>
          Open Reviews
        </ActionLink>
      </Actions>
    </div>
  )
}

function ClientsAttention() {
  const flagged = alerts.filter((a) => a.clientId)
  return (
    <div>
      <Heading>6 clients need adviser attention</Heading>
      <ul className="mt-2 divide-y rounded-lg border bg-background">
        {flagged.map((a) => (
          <li key={a.id} className="px-3 py-2">
            <Link href={`/clients/${a.clientId}`} className="block text-[13px] hover:underline">
              <span className="font-medium">{a.client}</span>
              <span className="block text-xs text-muted-foreground">{a.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Actions>
        <ActionLink href="/alerts">Open Alerts</ActionLink>
      </Actions>
    </div>
  )
}

function RiskChanges() {
  const changed = clients.filter((c) => c.risk.score !== c.risk.previousScore)
  return (
    <div>
      <Heading>
        {changed.length} {changed.length === 1 ? 'client has' : 'clients have'} a changed risk profile
      </Heading>
      <ul className="mt-2 space-y-2">
        {changed.map((c) => (
          <li key={c.id} className="rounded-lg border bg-background p-2.5">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {c.risk.previousScore}/10 → {c.risk.score}/10 · {c.risk.tool}, {c.risk.assessedOn}
            </p>
            <p className="mt-1 text-xs">
              Portfolio is {equityPct(c).toFixed(0)}% equity. A portfolio review may be required.
            </p>
          </li>
        ))}
      </ul>
      <Actions>
        <ActionLink href={`/clients/${changed[0]?.id ?? ''}`} primary>
          Review Changes
        </ActionLink>
      </Actions>
    </div>
  )
}

function Fallback({ client }: { client?: Client }) {
  return (
    <div>
      <Heading>I can help with that from your connected systems.</Heading>
      <p className="mt-1 text-muted-foreground">
        Try asking me to prepare a review, explain a number, draft a letter or find missing information
        {client ? ` for ${client.firstName}` : ''}.
      </p>
      <Actions>
        <ActionPrompt prompt="Show clients requiring adviser attention">What needs attention?</ActionPrompt>
      </Actions>
    </div>
  )
}

export function CopilotResponse({ plan }: { plan: CopilotPlan }) {
  const client = plan.clientId ? getClient(plan.clientId) : undefined
  switch (plan.kind) {
    case 'review-prepared':
      return <ReviewPrepared client={client!} />
    case 'changes':
      return <Changes client={client!} />
    case 'equity-source':
      return <EquitySource client={client!} />
    case 'risk-source':
      return <RiskSource client={client!} />
    case 'equity-explain':
      return <EquityExplain client={client!} />
    case 'attention':
      return <Attention client={client!} />
    case 'letter':
      return <Letter client={client!} />
    case 'missing':
      return <Missing client={client!} />
    case 'summary':
      return <Summary client={client!} />
    case 'brief':
      return <Brief client={client!} />
    case 'reviews-week':
      return <ReviewsWeek />
    case 'clients-attention':
      return <ClientsAttention />
    case 'risk-changes':
      return <RiskChanges />
    default:
      return <Fallback client={client} />
  }
}
