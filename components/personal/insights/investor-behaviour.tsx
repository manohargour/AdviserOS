import { AiMark, Meter, Panel, PanelHeader } from '@/components/personal/wealth/primitives'

const stats = [
  { label: 'Trading frequency', value: '3.2 / month', note: 'Median for similar investors: 1.1' },
  { label: 'Average holding period', value: '14 months', note: 'Excluding pension and funds' },
  { label: 'Win rate', value: '61%', note: '38 closed positions' },
  { label: 'Average gain', value: '+24.8%', note: 'On winning positions' },
  { label: 'Average loss', value: '-13.6%', note: 'On losing positions' },
  { label: 'Panic selling', value: '3 of 5', note: 'Corrections with net selling' },
  { label: 'Momentum purchases', value: '42%', note: 'Bought after a 20%+ rise' },
  { label: 'Independent decisions', value: '68%', note: 'vs. following news or community' },
]

const observations = [
  { text: 'You tend to increase positions after stocks have already risen more than 20%.', score: 42 },
  { text: 'You historically outperform when holding positions longer than 12 months — by 9.1% on average.', score: 78 },
  { text: 'You sold during 3 of the last 5 market corrections; on average prices recovered within 4 months.', score: 60 },
]

export function InvestorBehaviour() {
  return (
    <Panel id="behaviour" className="scroll-mt-24">
      <PanelHeader title="Your Investor Behaviour" description="Patterns from 4 years of transactions. Descriptive, not a judgement." icon={<AiMark size="sm" />} />
      <dl className="grid grid-cols-2 gap-px overflow-hidden border-y bg-border mt-5 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4">
            <dt className="text-[12px] text-muted-foreground">{s.label}</dt>
            <dd className="num mt-0.5 text-lg font-semibold tracking-tight">{s.value}</dd>
            <dd className="text-[11px] text-muted-foreground">{s.note}</dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col gap-4 p-5">
        {observations.map((o) => (
          <li key={o.text} className="grid gap-2 md:grid-cols-[1fr_12rem] md:items-center md:gap-6">
            <p className="text-[13px] leading-relaxed text-pretty">{o.text}</p>
            <div>
              <Meter value={o.score} tone={o.score > 70 ? 'positive' : 'neutral'} label="Pattern strength" />
              <p className="mt-1 text-[11px] text-muted-foreground">Pattern consistency {o.score}%</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
