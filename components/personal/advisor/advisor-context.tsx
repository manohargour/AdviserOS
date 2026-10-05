import Link from 'next/link'
import { goals, netWorth, user } from '@/lib/personal/data'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'
import { Dot, Meter, Panel } from '@/components/personal/wealth/primitives'
import { statusTone } from '@/components/personal/goals/goal-meta'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t px-5 py-4 first:border-t-0">
      <h3 className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  )
}

export function AdvisorContext() {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b bg-muted/40 px-5 py-3">
        <p className="text-[12px] font-medium">What the advisor can see</p>
        <p className="text-[11px] text-muted-foreground">Synced 4 minutes ago · 8 of 9 accounts live</p>
      </div>

      <Section title="Net worth">
        <p className="num text-xl font-semibold tracking-tight">{formatGBP(netWorth.total)}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          {[
            ['Investments', netWorth.investments],
            ['Property', netWorth.property],
            ['Cash', netWorth.cash],
            ['Liabilities', netWorth.liabilities],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="num font-medium">{formatCompactGBP(v as number)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Goals">
        <ul className="flex flex-col gap-3">
          {goals.map((g) => (
            <li key={g.id}>
              <Link href={`/me/goals/${g.id}`} className="block hover:opacity-80">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="flex items-center gap-1.5 truncate">
                    <Dot tone={statusTone(g.status)} />
                    {g.name}
                  </span>
                  <span className="num text-muted-foreground">{g.probability}%</span>
                </div>
                <Meter value={(g.current / g.target) * 100} tone="ink" className="mt-1.5 h-1" label={`${g.name} funded`} />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Risk profile">
        <p className="text-[13px] font-medium">{user.riskProfile}</p>
        <div className="mt-2 flex gap-1" role="img" aria-label={`Risk score ${user.riskScore} of 10`}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < user.riskScore ? 'h-1.5 flex-1 rounded-full bg-primary' : 'h-1.5 flex-1 rounded-full bg-muted'} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Current portfolio behaves closer to 7/10 due to tech concentration.</p>
      </Section>

      <Section title="Major exposures">
        <ul className="flex flex-col gap-2 text-[12px]">
          {[
            { label: 'Technology (look-through)', value: '41%', tone: 'warning' as const },
            { label: 'BP (employer)', value: '28.2%', tone: 'negative' as const },
            { label: 'Nvidia ecosystem', value: '21.1%', tone: 'negative' as const },
            { label: 'USD currency', value: '51%', tone: 'warning' as const },
          ].map((e) => (
            <li key={e.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5"><Dot tone={e.tone} />{e.label}</span>
              <span className="num font-medium">{e.value}</span>
            </li>
          ))}
        </ul>
      </Section>
    </Panel>
  )
}
