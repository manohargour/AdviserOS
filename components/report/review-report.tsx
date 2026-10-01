import { ADVISER, allocation, equityPct, gbp, type Client } from '@/lib/data'
import { LogoMark } from '@/components/brand/logo-mark'
import { AllocationDonut, ExposureChart, ValuationChart } from '@/components/report/report-charts'
import { ASSET_COLORS } from '@/components/report/asset-colors'
import { cn } from '@/lib/utils'

function Section({ n, title, children, className }: { n: number; title: string; children: React.ReactNode; className?: string }) {
  const id = `report-s${n}`
  return (
    <section aria-labelledby={id} className={cn('break-inside-avoid border-t pt-6', className)}>
      <h2 id={id} className="flex items-baseline gap-3 font-serif text-xl font-medium tracking-tight">
        <span className="font-sans text-xs font-semibold tabular-nums text-brass">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-brass/60 pl-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-serif text-2xl tabular-nums leading-tight">{value}</dd>
      {sub && <dd className="text-xs text-muted-foreground">{sub}</dd>}
    </div>
  )
}

export function ReviewReport({
  client,
  adviserName,
  status,
  approvedAt,
  letter,
}: {
  client: Client
  adviserName: string
  status: string
  approvedAt: string | null
  letter: string | null
}) {
  const rows = allocation(client)
  const change = client.portfolioValue - client.previousValue
  const changePct = (change / client.previousValue) * 100
  const equityNow = equityPct(client)
  const equityDelta = equityNow - client.previousEquityPct
  const riskMoved = client.risk.score !== client.risk.previousScore
  const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const reference = `AR-${client.initials}-${client.nextReview.slice(-4)}`
  const holdings = [...client.holdings].sort((a, b) => b.value - a.value)
  const platforms = Object.entries(
    client.holdings.reduce<Record<string, number>>((acc, h) => ({ ...acc, [h.platform]: (acc[h.platform] ?? 0) + h.value }), {}),
  )
  const approved = status === 'Approved'
  const sources = [...new Set(client.changes.map((c) => c.source))]

  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-xl border bg-card shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="bg-sidebar px-8 py-8 text-sidebar-foreground md:px-12 md:py-10 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold text-white">{ADVISER.firm}</p>
              <p className="text-xs text-sidebar-foreground/70">Independent financial advice</p>
            </div>
          </div>
          <p className="rounded-sm border border-sidebar-primary/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-primary">
            Private &amp; confidential
          </p>
        </div>
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">Annual Review Report</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">{client.name}</h1>
          <p className="mt-2 text-sm text-sidebar-foreground/80">
            Review period {client.lastReview} to {client.nextReview}
          </p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 text-sm md:grid-cols-4">
          {[
            ['Prepared for', client.name],
            ['Prepared by', adviserName],
            ['Report date', reportDate],
            ['Reference', reference],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">{k}</dt>
              <dd className="mt-0.5 font-medium text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div
        className={cn(
          'flex items-center justify-between gap-3 px-8 py-2.5 text-xs md:px-12',
          approved ? 'bg-positive-soft text-positive' : 'bg-warning-soft text-accent-foreground',
        )}
      >
        <span className="font-semibold uppercase tracking-wider">{approved ? 'Approved' : 'Draft for adviser review'}</span>
        <span>
          {approved && approvedAt
            ? `Signed off ${new Date(approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'Not to be sent until approved'}
        </span>
      </div>

      <div className="space-y-10 px-8 py-10 md:px-12">
        <Section n={1} title="Summary">
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <Kpi label="Portfolio value" value={gbp(client.portfolioValue)} sub={`at ${client.nextReview}`} />
            <Kpi
              label="Change in value"
              value={`${change >= 0 ? '+' : '−'}${gbp(Math.abs(change))}`}
              sub={`${changePct >= 0 ? '+' : '−'}${Math.abs(changePct).toFixed(1)}% since last review`}
            />
            <Kpi
              label="Equity exposure"
              value={`${equityNow.toFixed(0)}%`}
              sub={`${equityDelta >= 0 ? '+' : '−'}${Math.abs(equityDelta).toFixed(0)} pts from ${client.previousEquityPct}%`}
            />
            <Kpi label="Risk profile" value={client.risk.label} sub={`${client.risk.score} of 10 · ${client.risk.tool}`} />
          </dl>
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-pretty">
            Over the review period your portfolio moved from {gbp(client.previousValue)} to {gbp(client.portfolioValue)}. Equity
            exposure is now {equityNow.toFixed(0)}% against {client.previousEquityPct}% at your last review.{' '}
            {riskMoved
              ? `Your attitude to risk was reassessed on ${client.risk.assessedOn} and has changed from ${client.risk.previousScore} to ${client.risk.score}.`
              : `Your attitude to risk was reassessed on ${client.risk.assessedOn} and remains ${client.risk.label} (${client.risk.score} of 10).`}{' '}
            {client.outstanding.length > 0 &&
              `${client.outstanding.length} item${client.outstanding.length === 1 ? '' : 's'} remain open and are listed in section 7.`}
          </p>
        </Section>

        <Section n={2} title="Portfolio valuation">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <ValuationChart
                data={[
                  { label: `Last review · ${client.lastReview}`, value: client.previousValue },
                  { label: `This review · ${client.nextReview}`, value: client.portfolioValue },
                ]}
              />
            </div>
            <table className="text-sm md:col-span-2">
              <caption className="sr-only">Valuation reconciliation</caption>
              <tbody className="divide-y">
                <tr>
                  <th scope="row" className="py-2 text-left font-normal text-muted-foreground">Value at last review</th>
                  <td className="py-2 text-right tabular-nums">{gbp(client.previousValue)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 text-left font-normal text-muted-foreground">Value at this review</th>
                  <td className="py-2 text-right tabular-nums">{gbp(client.portfolioValue)}</td>
                </tr>
                <tr className="font-semibold">
                  <th scope="row" className="py-2 text-left">Net change</th>
                  <td className={cn('py-2 text-right tabular-nums', change >= 0 ? 'text-positive' : 'text-destructive')}>
                    {change >= 0 ? '+' : '−'}
                    {gbp(Math.abs(change))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Net change includes market movement, contributions and withdrawals. It is not a measure of investment return.
          </p>
        </Section>

        <Section n={3} title="Asset allocation">
          <div className="grid items-center gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <AllocationDonut rows={rows} total={gbp(client.portfolioValue)} />
            </div>
            <table className="w-full text-sm md:col-span-3">
              <caption className="sr-only">Allocation by asset class</caption>
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="pb-2 text-left font-medium">Asset class</th>
                  <th scope="col" className="pb-2 text-right font-medium">Value</th>
                  <th scope="col" className="pb-2 text-right font-medium">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.assetClass}>
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="size-2.5 rounded-sm print:[print-color-adjust:exact]" style={{ background: ASSET_COLORS[r.assetClass] }} />
                        {r.assetClass}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{gbp(r.value)}</td>
                    <td className="py-2 text-right tabular-nums">{r.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-8 text-sm font-semibold">Growth vs defensive assets</h3>
          <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-chart-4" /> Last review
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-chart-1" /> This review
            </span>
          </div>
          <ExposureChart
            data={[
              { label: 'Equity', previous: client.previousEquityPct, current: equityNow },
              { label: 'Defensive', previous: 100 - client.previousEquityPct, current: 100 - equityNow },
            ]}
          />
        </Section>

        <Section n={4} title="Holdings">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Holdings at {client.nextReview}</caption>
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="pb-2 text-left font-medium">Fund</th>
                  <th scope="col" className="pb-2 text-left font-medium">Asset class</th>
                  <th scope="col" className="pb-2 text-left font-medium">Platform</th>
                  <th scope="col" className="pb-2 text-right font-medium">Value</th>
                  <th scope="col" className="w-40 pb-2 text-right font-medium">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {holdings.map((h) => {
                  const w = (h.value / client.portfolioValue) * 100
                  return (
                    <tr key={h.name}>
                      <td className="py-2.5 font-medium">{h.name}</td>
                      <td className="py-2.5 text-muted-foreground">{h.assetClass}</td>
                      <td className="py-2.5 text-muted-foreground">{h.platform}</td>
                      <td className="py-2.5 text-right tabular-nums">{gbp(h.value)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className="h-full rounded-full print:[print-color-adjust:exact]" style={{ width: `${w}%`, background: ASSET_COLORS[h.assetClass] }} />
                          </div>
                          <span className="w-12 text-right tabular-nums">{w.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/20 font-semibold">
                  <td className="pt-2.5" colSpan={3}>
                    Total{platforms.length > 1 && ` · ${platforms.map(([p, v]) => `${p} ${gbp(v)}`).join(' · ')}`}
                  </td>
                  <td className="pt-2.5 text-right tabular-nums">{gbp(client.portfolioValue)}</td>
                  <td className="pt-2.5 text-right tabular-nums">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>

        <Section n={5} title="Attitude to risk">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="flex gap-1" role="img" aria-label={`Risk score ${client.risk.score} of 10${riskMoved ? `, previously ${client.risk.previousScore}` : ''}`}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <div key={n} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className={cn(
                        'h-8 w-full rounded-sm print:[print-color-adjust:exact]',
                        n === client.risk.score ? 'bg-primary' : n === client.risk.previousScore ? 'bg-chart-4' : 'bg-muted',
                      )}
                    />
                    <span className={cn('text-xs tabular-nums', n === client.risk.score ? 'font-semibold' : 'text-muted-foreground')}>{n}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Lower risk</span>
                <span>Higher risk</span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm md:col-span-2">
              <div>
                <dt className="text-xs text-muted-foreground">Current profile</dt>
                <dd className="font-medium">
                  {client.risk.label} ({client.risk.score})
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Previous score</dt>
                <dd className="font-medium">{client.risk.previousScore}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assessed</dt>
                <dd className="font-medium">{client.risk.assessedOn}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Method</dt>
                <dd className="font-medium">{client.risk.tool}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <Section n={6} title="Objectives and progress">
          <ul className="space-y-4">
            {client.goals.map((g) => (
              <li key={g.title} className="grid items-center gap-2 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Target {g.target} · {g.horizon}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className={cn('h-full rounded-full print:[print-color-adjust:exact]', g.progress >= 100 ? 'bg-positive' : 'bg-brass')}
                      style={{ width: `${Math.min(g.progress, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm tabular-nums">{g.progress}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section n={7} title="Changes and outstanding items">
          <table className="w-full text-sm">
            <caption className="sr-only">Changes since last review</caption>
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="pb-2 text-left font-medium">Area</th>
                <th scope="col" className="pb-2 text-left font-medium">What changed</th>
                <th scope="col" className="pb-2 text-right font-medium">Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y align-top">
              {client.changes.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-4 font-medium">{c.title}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{c.detail}</td>
                  <td className="whitespace-nowrap py-2.5 text-right tabular-nums">{c.from ? `${c.from} → ${c.to}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {client.outstanding.length > 0 && (
            <div className="mt-6 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Open items</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {client.outstanding.map((o) => (
                  <li key={o.id} className="flex gap-3">
                    <span className="mt-0.5 shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {o.kind === 'client' ? 'From you' : 'Adviser'}
                    </span>
                    <span>
                      <span className="font-medium">{o.title}.</span> <span className="text-muted-foreground">{o.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section n={8} title="Adviser recommendation">
          <div className="rounded-lg border-2 border-dashed border-brass/50 bg-accent/30 p-5 text-sm">
            <p className="font-medium">To be completed by {adviserName}.</p>
            <p className="mt-1 text-muted-foreground">
              Recommendations are written and signed by your adviser following the review meeting. AdviserOS does not draft advice.
            </p>
          </div>
        </Section>

        {letter && (
          <Section n={9} title="Covering letter" className="print:break-before-page">
            <div className="whitespace-pre-line font-serif text-[15px] leading-relaxed">{letter}</div>
          </Section>
        )}

        <section aria-labelledby="report-info" className="break-inside-avoid border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <h2 id="report-info" className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Important information
          </h2>
          <p className="mt-2">
            The value of investments and any income from them can fall as well as rise, and you may get back less than you invested.
            Past performance is not a reliable indicator of future results. Figures are valuations at the dates shown and are drawn from:{' '}
            {sources.join('; ')}.
          </p>
          <p className="mt-2">
            This report is a summary of your arrangements for review purposes and does not constitute a personal recommendation. {ADVISER.firm}{' '}
            is authorised and regulated by the Financial Conduct Authority.
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t pt-4">
            <div>
              <div className="h-8 w-56 border-b border-foreground/40" aria-hidden />
              <p className="mt-1 text-foreground">{adviserName}, Financial Adviser</p>
            </div>
            <p>
              {reference} · {reportDate}
            </p>
          </div>
        </section>
      </div>
    </article>
  )
}
