import 'server-only'

import { Document, G, Page, Path, Rect, StyleSheet, Svg, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { ADVISER, allocation, equityPct, gbp, type AssetClass, type Client } from '@/lib/data'
import { planFor, type Plan } from '@/lib/planning'

const NAVY = '#1c2638'
const BRASS = '#a8834f'
const INK = '#1f2328'
const MUTED = '#6b7280'
const RULE = '#e5e1d8'
const PDF_COLORS: Record<AssetClass, string> = {
  Equity: '#2f4a6d',
  Bonds: '#a8834f',
  Property: '#5f8a7a',
  Alternatives: '#9aa5b8',
  Cash: '#cdbf9f',
}

const s = StyleSheet.create({
  page: { paddingBottom: 56, fontFamily: 'Helvetica', fontSize: 9.5, color: INK, lineHeight: 1.45 },
  cover: { backgroundColor: NAVY, color: '#e8e4da', paddingHorizontal: 44, paddingTop: 36, paddingBottom: 28 },
  firm: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#ffffff' },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: BRASS, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  h1: { fontFamily: 'Times-Roman', fontSize: 30, lineHeight: 1.2, color: '#ffffff', marginTop: 8, marginBottom: 6 },
  metaRow: { flexDirection: 'row', marginTop: 20, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#3a4558' },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 7, color: '#a4abb8', textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 9.5, color: '#ffffff', marginTop: 2 },
  body: { paddingHorizontal: 44, paddingTop: 22 },
  section: { marginTop: 18, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: RULE },
  h2: { fontFamily: 'Times-Roman', fontSize: 15, marginBottom: 8 },
  num: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: BRASS },
  kpis: { flexDirection: 'row', gap: 10 },
  kpi: { flex: 1, borderLeftWidth: 2, borderLeftColor: BRASS, paddingLeft: 8 },
  kpiLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  kpiValue: { fontFamily: 'Times-Roman', fontSize: 16, marginTop: 2 },
  kpiSub: { fontSize: 8, color: MUTED },
  th: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: INK, paddingBottom: 4, fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 5 },
  right: { textAlign: 'right' },
  muted: { color: MUTED },
  note: { fontSize: 8, color: MUTED, marginTop: 6 },
  letter: { fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 22, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: MUTED, borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 6 },
})

function Section({ n, title, children, breakBefore }: { n: number; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <View style={s.section} wrap={false} break={breakBefore}>
      <Text style={s.h2}>
        <Text style={s.num}>{String(n).padStart(2, '0')}   </Text>
        {title}
      </Text>
      {children}
    </View>
  )
}

function donutSlices(rows: { assetClass: AssetClass; pct: number }[], r: number, inner: number) {
  let angle = -Math.PI / 2
  return rows.map((row) => {
    const sweep = (row.pct / 100) * Math.PI * 2
    const end = angle + sweep
    const large = sweep > Math.PI ? 1 : 0
    const p = (rad: number, radius: number) => `${r + radius * Math.cos(rad)} ${r + radius * Math.sin(rad)}`
    const d = `M ${p(angle, r)} A ${r} ${r} 0 ${large} 1 ${p(end, r)} L ${p(end, inner)} A ${inner} ${inner} 0 ${large} 0 ${p(angle, inner)} Z`
    angle = end
    return { d, color: PDF_COLORS[row.assetClass], key: row.assetClass }
  })
}

const W = 507
const signed = (n: number, d = 1) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(d)}%`
const TONE = { good: '#2f7a55', bad: '#b4432f', warn: '#9a6b1f', neutral: MUTED }
const SERIES = { central: NAVY, strong: '#5f8a7a', weak: BRASS }
const WRAPPER_PDF = [NAVY, BRASS, '#5f8a7a', '#cdbf9f']
const COST_PDF = [NAVY, BRASS, '#5f8a7a', '#9aa5b8']

function Stats({ items }: { items: [string, string, string?, string?][] }) {
  return (
    <View style={s.kpis}>
      {items.map(([label, value, sub, color]) => (
        <View key={label} style={s.kpi}>
          <Text style={s.kpiLabel}>{label}</Text>
          <Text style={[s.kpiValue, color ? { color } : {}]}>{value}</Text>
          {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
        </View>
      ))}
    </View>
  )
}

function Bar({ pct, color, width = W, height = 5 }: { pct: number; color: string; width?: number; height?: number }) {
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill="#efece5" />
      <Rect x={0} y={0} width={Math.max(0.5, (width * Math.min(100, pct)) / 100)} height={height} fill={color} />
    </Svg>
  )
}

function PerformancePdf({ plan }: { plan: Plan }) {
  const p = plan.performance
  const values = p.calendar.flatMap((c) => [c.portfolio, c.benchmark])
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const h = 120
  const zero = (max / (max - min)) * h
  const groupW = W / p.calendar.length
  const barW = 16
  const y = (v: number) => (v >= 0 ? zero - (v / (max - min)) * h : zero)
  const bh = (v: number) => (Math.abs(v) / (max - min)) * h
  return (
    <>
      <View style={s.th}>
        <Text style={{ flex: 2 }}>Period</Text>
        <Text style={[{ flex: 1 }, s.right]}>Portfolio</Text>
        <Text style={[{ flex: 1 }, s.right]}>Benchmark</Text>
        <Text style={[{ flex: 1 }, s.right]}>Relative</Text>
      </View>
      {p.periods.map((r) => (
        <View key={r.label} style={s.tr}>
          <Text style={{ flex: 2, fontFamily: 'Helvetica-Bold' }}>{r.label}</Text>
          <Text style={[{ flex: 1 }, s.right]}>{signed(r.portfolio)}</Text>
          <Text style={[{ flex: 1 }, s.right, s.muted]}>{signed(r.benchmark)}</Text>
          <Text style={[{ flex: 1, fontFamily: 'Helvetica-Bold', color: r.relative >= 0 ? TONE.good : TONE.bad }, s.right]}>{signed(r.relative)}</Text>
        </View>
      ))}
      <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 10, marginBottom: 4 }}>
        Calendar year returns <Text style={[s.muted, { fontFamily: 'Helvetica' }]}>  ■ Portfolio  </Text>
        <Text style={{ fontFamily: 'Helvetica', color: '#9aa5b8' }}>■ {p.benchmark}</Text>
      </Text>
      <Svg width={W} height={h + 26}>
        <Rect x={0} y={zero + 10} width={W} height={0.5} fill={INK} />
        {p.calendar.map((c, i) => {
          const cx = i * groupW + groupW / 2
          return (
            <G key={c.year}>
              <Rect x={cx - barW - 1} y={y(c.portfolio) + 10} width={barW} height={Math.max(0.5, bh(c.portfolio))} fill={NAVY} />
              <Rect x={cx + 1} y={y(c.benchmark) + 10} width={barW} height={Math.max(0.5, bh(c.benchmark))} fill="#9aa5b8" />
              <Text x={cx - barW - 1} y={c.portfolio >= 0 ? y(c.portfolio) + 7 : y(c.portfolio) + bh(c.portfolio) + 17} style={{ fontSize: 6.5 }}>
                {c.portfolio.toFixed(1)}
              </Text>
              <Text x={cx + 1} y={c.benchmark >= 0 ? y(c.benchmark) + 7 : y(c.benchmark) + bh(c.benchmark) + 17} fill={MUTED} style={{ fontSize: 6.5 }}>
                {c.benchmark.toFixed(1)}
              </Text>
              <Text x={cx - 9} y={h + 24} fill={MUTED} style={{ fontSize: 7.5 }}>
                {c.year}
              </Text>
            </G>
          )
        })}
      </Svg>
      <Text style={s.note}>Returns after fund charges, before platform and advice fees. Past performance is not a reliable indicator of future returns.</Text>
    </>
  )
}

function RiskPdf({ client, plan }: { client: Client; plan: Plan }) {
  const r = plan.risk
  const tone = r.alignment === 'Within range' ? TONE.good : TONE.bad
  return (
    <>
      <Stats
        items={[
          ['Attitude to risk', `${client.risk.score}/10`, `${client.risk.label} · was ${client.risk.previousScore}/10`],
          ['Capacity for loss', r.capacityForLoss, `Age ${client.age}`],
          ['Severe market fall', `-${gbp(Math.abs(r.stressLoss))}`, `${r.stressPct.toFixed(1)}% estimated`, TONE.bad],
          ['Expected volatility', `${r.volatility.toFixed(1)}%`, 'a year, indicative'],
        ]}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>Equity exposure against model range</Text>
        <Text style={{ fontFamily: 'Helvetica-Bold', color: tone, fontSize: 8 }}>{r.alignment.toUpperCase()}</Text>
      </View>
      <Svg width={W} height={34} style={{ marginTop: 4 }}>
        <Rect x={0} y={12} width={W} height={12} fill="#efece5" />
        <Rect x={(W * r.modelMin) / 100} y={12} width={(W * (r.modelMax - r.modelMin)) / 100} height={12} fill="#cfe3d6" />
        <Rect x={(W * r.equity) / 100 - 0.75} y={8} width={1.5} height={20} fill={INK} />
        <Text x={Math.min(W - 24, (W * r.equity) / 100 - 8)} y={6} style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>
          {`${r.equity.toFixed(0)}%`}
        </Text>
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: MUTED }}>
        <Text>0% equity</Text>
        <Text>
          Model range {r.modelMin}–{r.modelMax}%
        </Text>
        <Text>100%</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <View style={{ flex: 1, borderWidth: 0.5, borderColor: RULE, padding: 8 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Capacity for loss</Text>
          <Text style={s.muted}>{r.capacityNote}</Text>
        </View>
        <View style={{ flex: 1, borderLeftWidth: 2.5, borderLeftColor: tone, backgroundColor: '#f6f4ef', padding: 8 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Suitability</Text>
          <Text>{r.statement}</Text>
        </View>
      </View>
      <Text style={s.note}>
        Assessed {client.risk.assessedOn} using {client.risk.tool}.
      </Text>
    </>
  )
}

function GoalsPdf({ plan }: { plan: Plan }) {
  const { projection, goals, assumptions } = plan.goals
  const h = 130
  const chartW = W - 60
  const lo = projection[0].weak * 0.95
  const hi = projection[projection.length - 1].strong * 1.02
  const x = (i: number) => (chartW * i) / (projection.length - 1)
  const y = (v: number) => 6 + h - ((v - lo) / (hi - lo)) * h
  const line = (k: 'weak' | 'central' | 'strong') => projection.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p[k])}`).join(' ')
  const last = projection[projection.length - 1]
  const statusColor = { Achieved: TONE.good, 'On track': TONE.good, Monitor: TONE.warn, Behind: TONE.bad }
  return (
    <>
      <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
        Projected portfolio value{'  '}
        <Text style={{ fontFamily: 'Helvetica', color: SERIES.strong }}>■ Strong  </Text>
        <Text style={{ fontFamily: 'Helvetica', color: SERIES.central }}>■ Central  </Text>
        <Text style={{ fontFamily: 'Helvetica', color: SERIES.weak }}>■ Weak</Text>
      </Text>
      <Svg width={W} height={h + 24}>
        {[0, 0.5, 1].map((t) => (
          <Rect key={t} x={0} y={6 + h * t} width={chartW} height={0.4} fill={RULE} />
        ))}
        {(['strong', 'weak', 'central'] as const).map((k) => (
          <Path key={k} d={line(k)} stroke={SERIES[k]} strokeWidth={k === 'central' ? 2 : 1.2} strokeDasharray={k === 'central' ? undefined : '3 2'} fill="none" />
        ))}
        {(['strong', 'central', 'weak'] as const).map((k) => (
          <Text key={k} x={chartW + 4} y={y(last[k]) + 3} fill={SERIES[k]} style={{ fontSize: 7 }}>
            {gbp(last[k])}
          </Text>
        ))}
        {projection
          .filter((_, i) => i % 2 === 0)
          .map((p, j) => (
            <Text key={p.year} x={x(j * 2) - 8} y={h + 22} fill={MUTED} style={{ fontSize: 7 }}>
              {String(p.year)}
            </Text>
          ))}
      </Svg>
      <View style={[s.th, { marginTop: 6 }]}>
        <Text style={{ flex: 2 }}>Scenario</Text>
        <Text style={[{ flex: 1 }, s.right]}>In 5 years</Text>
        <Text style={[{ flex: 1 }, s.right]}>In 10 years</Text>
      </View>
      {(['strong', 'central', 'weak'] as const).map((k) => (
        <View key={k} style={s.tr}>
          <Text style={{ flex: 2, textTransform: 'capitalize', fontFamily: k === 'central' ? 'Helvetica-Bold' : 'Helvetica' }}>{k}</Text>
          <Text style={[{ flex: 1 }, s.right]}>{gbp(projection[5][k])}</Text>
          <Text style={[{ flex: 1 }, s.right]}>{gbp(last[k])}</Text>
        </View>
      ))}
      <Text style={s.note}>{assumptions} Projections are illustrations, not guarantees.</Text>
      <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 4 }}>Objectives</Text>
      {goals.map((g) => (
        <View key={g.title} style={{ marginBottom: 7 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {g.title} <Text style={[s.muted, { fontFamily: 'Helvetica' }]}>· {g.target} · {g.horizon}</Text>
            </Text>
            <Text style={{ color: statusColor[g.status], fontFamily: 'Helvetica-Bold', fontSize: 8 }}>
              {g.progress}% · {g.status.toUpperCase()}
            </Text>
          </View>
          <View style={{ marginTop: 3 }}>
            <Bar pct={g.progress} color={statusColor[g.status]} />
          </View>
        </View>
      ))}
    </>
  )
}

function TaxPdf({ plan }: { plan: Plan }) {
  const t = plan.tax
  return (
    <>
      <View style={s.th}>
        <Text style={{ flex: 4 }}>Wrapper</Text>
        <Text style={[{ flex: 1 }, s.right]}>Value</Text>
        <Text style={[{ flex: 0.8 }, s.right]}>Share</Text>
      </View>
      {t.wrappers.map((w, i) => (
        <View key={w.name} style={s.tr}>
          <View style={{ flex: 4, flexDirection: 'row', gap: 5 }}>
            <View style={{ width: 7, height: 7, marginTop: 2, backgroundColor: WRAPPER_PDF[i] }} />
            <Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{w.name}</Text>
              {'\n'}
              <Text style={[s.muted, { fontSize: 8 }]}>{w.treatment}</Text>
            </Text>
          </View>
          <Text style={[{ flex: 1 }, s.right]}>{gbp(w.value)}</Text>
          <Text style={[{ flex: 0.8 }, s.right]}>{w.pct.toFixed(0)}%</Text>
        </View>
      ))}
      <Svg width={W} height={8} style={{ marginTop: 6 }}>
        {t.wrappers.reduce<{ x: number; els: React.ReactElement[] }>(
          (acc, w, i) => {
            const width = (W * w.pct) / 100
            acc.els.push(<Rect key={w.name} x={acc.x} y={0} width={width} height={8} fill={WRAPPER_PDF[i]} />)
            acc.x += width
            return acc
          },
          { x: 0, els: [] },
        ).els}
      </Svg>
      <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 6 }}>Allowances used, {t.taxYear} tax year</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {t.allowances.map((a) => (
          <View key={a.name} style={{ width: (W - 10) / 2, borderWidth: 0.5, borderColor: RULE, padding: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{a.name}</Text>
              <Text style={s.muted}>{gbp(a.limit)}</Text>
            </View>
            <View style={{ marginVertical: 4 }}>
              <Bar pct={(a.used / a.limit) * 100} color={NAVY} width={(W - 10) / 2 - 14} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', fontSize: 8 }}>
              <Text>{gbp(a.used)} used</Text>
              <Text style={{ fontFamily: a.remaining > 0 ? 'Helvetica-Bold' : 'Helvetica', color: a.remaining > 0 ? TONE.warn : MUTED }}>
                {gbp(a.remaining)} remaining
              </Text>
            </View>
          </View>
        ))}
      </View>
      {t.giaGain > 0 ? <Text style={s.note}>Estimated unrealised gain in the general investment account: {gbp(t.giaGain)}.</Text> : null}
    </>
  )
}

function CostsPdf({ plan }: { plan: Plan }) {
  const c = plan.costs
  let cursor = 0
  return (
    <>
      <Stats
        items={[
          ['Total ongoing cost', `${c.totalPct.toFixed(2)}%`, 'a year'],
          ['In pounds', gbp(c.total), 'this year, estimated'],
          ['Effect over 10 years', gbp(c.chargesEffect), 'reduction in projected value'],
        ]}
      />
      <Svg width={W} height={10} style={{ marginTop: 12 }}>
        {c.lines.map((l, i) => {
          const width = (W * l.pct) / c.totalPct
          const el = <Rect key={l.label} x={cursor} y={0} width={width} height={10} fill={COST_PDF[i]} />
          cursor += width
          return el
        })}
      </Svg>
      <View style={[s.th, { marginTop: 8 }]}>
        <Text style={{ flex: 3 }}>Charge</Text>
        <Text style={[{ flex: 1 }, s.right]}>Rate</Text>
        <Text style={[{ flex: 1 }, s.right]}>Cost a year</Text>
      </View>
      {c.lines.map((l, i) => (
        <View key={l.label} style={s.tr}>
          <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, backgroundColor: COST_PDF[i] }} />
            <Text>
              {l.label}
              {l.label === 'Platform fee' ? <Text style={s.muted}> ({c.platform})</Text> : null}
            </Text>
          </View>
          <Text style={[{ flex: 1 }, s.right]}>{l.pct.toFixed(2)}%</Text>
          <Text style={[{ flex: 1 }, s.right]}>{gbp(l.amount)}</Text>
        </View>
      ))}
      <View style={[s.tr, { borderBottomWidth: 0, fontFamily: 'Helvetica-Bold' }]}>
        <Text style={{ flex: 3 }}>Total</Text>
        <Text style={[{ flex: 1 }, s.right]}>{c.totalPct.toFixed(2)}%</Text>
        <Text style={[{ flex: 1 }, s.right]}>{gbp(c.total)}</Text>
      </View>
      <Text style={s.note}>Estimated on the current valuation in line with MiFID II disclosure. Your annual ex-post statement confirms exact amounts.</Text>
    </>
  )
}

function ActionsPdf({ plan, adviserName }: { plan: Plan; adviserName: string }) {
  const color = { High: TONE.bad, Medium: TONE.warn, Low: TONE.neutral }
  return (
    <>
      {plan.actions.map((a, i) => (
        <View key={a.title} style={[s.tr, { gap: 10 }]} wrap={false}>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 14, color: BRASS, width: 14 }}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{a.title}</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: color[a.priority] }}>   {a.priority.toUpperCase()}</Text>
            </Text>
            <Text style={s.muted}>{a.rationale}</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{a.owner === 'Client' ? 'For you' : adviserName}</Text> · {a.timing}
            </Text>
          </View>
        </View>
      ))}
      <Text style={s.note}>Proposed actions are confirmed by {adviserName} before the report is issued.</Text>
    </>
  )
}

export type ReportPdfInput = {
  client: Client
  adviserName: string
  title: string
  status: string
  coverNote: string | null
  letter: string | null
  reference: string
  issuedOn: string
}

function ReportDocument({ client, adviserName, title, status, coverNote, letter, reference, issuedOn }: ReportPdfInput) {
  const rows = allocation(client)
  const change = client.portfolioValue - client.previousValue
  const changePct = (change / client.previousValue) * 100
  const equityNow = equityPct(client)
  const holdings = [...client.holdings].sort((a, b) => b.value - a.value)
  const maxValue = Math.max(client.portfolioValue, client.previousValue)
  const sources = [...new Set(client.changes.map((c) => c.source))]
  const plan = planFor(client)

  return (
    <Document title={title} author={ADVISER.firm} subject={`Annual review for ${client.name}`}>
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.firm}>{ADVISER.firm}</Text>
              <Text style={{ fontSize: 8, color: '#a4abb8' }}>Independent financial advice</Text>
            </View>
            <View style={{ alignSelf: 'flex-start', borderWidth: 0.5, borderColor: BRASS, paddingHorizontal: 6, paddingVertical: 4 }}>
              <Text style={{ fontSize: 7, lineHeight: 1, color: BRASS, letterSpacing: 1.5 }}>PRIVATE &amp; CONFIDENTIAL</Text>
            </View>
          </View>
          <Text style={[s.eyebrow, { marginTop: 30 }]}>Annual Review Report</Text>
          <Text style={s.h1}>{client.name}</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.4, color: '#c9ced8' }}>
            Review period {client.lastReview} to {client.nextReview}
          </Text>
          <View style={s.metaRow}>
            {[
              ['Prepared for', client.name],
              ['Prepared by', adviserName],
              ['Reference', reference],
              ['Status', status],
            ].map(([label, value]) => (
              <View key={label} style={s.metaCell}>
                <Text style={s.metaLabel}>{label}</Text>
                <Text style={s.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.body}>
          {coverNote ? <Text style={[s.letter, { fontSize: 10.5 }]}>{coverNote}</Text> : null}

          <Section n={1} title="Summary">
            <View style={s.kpis}>
              <View style={s.kpi}>
                <Text style={s.kpiLabel}>Portfolio value</Text>
                <Text style={s.kpiValue}>{gbp(client.portfolioValue)}</Text>
                <Text style={s.kpiSub}>at {client.nextReview}</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiLabel}>Net change</Text>
                <Text style={s.kpiValue}>
                  {change >= 0 ? '+' : '-'}
                  {gbp(Math.abs(change))}
                </Text>
                <Text style={s.kpiSub}>{changePct.toFixed(1)}% since last review</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiLabel}>Equity exposure</Text>
                <Text style={s.kpiValue}>{equityNow.toFixed(1)}%</Text>
                <Text style={s.kpiSub}>was {client.previousEquityPct.toFixed(1)}%</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiLabel}>Risk profile</Text>
                <Text style={s.kpiValue}>{client.risk.label}</Text>
                <Text style={s.kpiSub}>
                  Score {client.risk.score} (was {client.risk.previousScore})
                </Text>
              </View>
            </View>
          </Section>

          <Section n={2} title="Portfolio valuation">
            {[
              ['Last review', client.lastReview, client.previousValue, '#9aa5b8'],
              ['This review', client.nextReview, client.portfolioValue, NAVY],
            ].map(([label, date, value, color]) => (
              <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ width: 90 }}>
                  {label as string}
                  {'\n'}
                  <Text style={s.muted}>{date as string}</Text>
                </Text>
                <Svg width={300} height={16}>
                  <Rect x={0} y={2} width={(300 * (value as number)) / maxValue} height={12} fill={color as string} />
                </Svg>
                <Text style={{ marginLeft: 8, fontFamily: 'Helvetica-Bold' }}>{gbp(value as number)}</Text>
              </View>
            ))}
            <Text style={s.note}>Net change includes market movement, contributions and withdrawals. It is not a measure of investment return.</Text>
          </Section>

          <Section n={3} title="Performance against benchmark">
            <PerformancePdf plan={plan} />
          </Section>

          <Section n={4} title="Asset allocation">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                {donutSlices(rows, 60, 38).map((slice) => (
                  <Path key={slice.key} d={slice.d} fill={slice.color} />
                ))}
              </Svg>
              <View style={{ flex: 1 }}>
                <View style={s.th}>
                  <Text style={{ flex: 2 }}>Asset class</Text>
                  <Text style={[{ flex: 1 }, s.right]}>Value</Text>
                  <Text style={[{ flex: 1 }, s.right]}>Weight</Text>
                </View>
                {rows.map((r) => (
                  <View key={r.assetClass} style={s.tr}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 7, height: 7, backgroundColor: PDF_COLORS[r.assetClass] }} />
                      <Text>{r.assetClass}</Text>
                    </View>
                    <Text style={[{ flex: 1 }, s.right]}>{gbp(r.value)}</Text>
                    <Text style={[{ flex: 1 }, s.right]}>{r.pct.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Section>
        </View>

        <View style={s.body}>
          <Section n={5} title="Holdings">
            <View style={s.th}>
              <Text style={{ flex: 3 }}>Fund</Text>
              <Text style={{ flex: 1.3 }}>Asset class</Text>
              <Text style={{ flex: 1.3 }}>Platform</Text>
              <Text style={[{ flex: 1.2 }, s.right]}>Value</Text>
              <Text style={[{ flex: 1.6 }, s.right]}>Weight</Text>
            </View>
            {holdings.map((h) => {
              const w = (h.value / client.portfolioValue) * 100
              return (
                <View key={h.name} style={s.tr}>
                  <Text style={{ flex: 3, fontFamily: 'Helvetica-Bold' }}>{h.name}</Text>
                  <Text style={[{ flex: 1.3 }, s.muted]}>{h.assetClass}</Text>
                  <Text style={[{ flex: 1.3 }, s.muted]}>{h.platform}</Text>
                  <Text style={[{ flex: 1.2 }, s.right]}>{gbp(h.value)}</Text>
                  <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <Svg width={50} height={6}>
                      <Rect x={0} y={0} width={50} height={6} fill="#efece5" />
                      <Rect x={0} y={0} width={Math.max(1, w * 0.5)} height={6} fill={PDF_COLORS[h.assetClass]} />
                    </Svg>
                    <Text style={{ width: 30, textAlign: 'right' }}>{w.toFixed(1)}%</Text>
                  </View>
                </View>
              )
            })}
          </Section>

          <Section n={6} title="Risk and suitability">
            <RiskPdf client={client} plan={plan} />
          </Section>

          <Section n={7} title="Goals and projections">
            <GoalsPdf plan={plan} />
          </Section>

          <Section n={8} title="Tax wrappers and allowances">
            <TaxPdf plan={plan} />
          </Section>

          <Section n={9} title="Costs and charges">
            <CostsPdf plan={plan} />
          </Section>

          <Section n={10} title="Changes since last review">
            <View style={s.th}>
              <Text style={{ flex: 1.4 }}>Area</Text>
              <Text style={{ flex: 3 }}>What changed</Text>
              <Text style={[{ flex: 1.3 }, s.right]}>Movement</Text>
            </View>
            {client.changes.map((c) => (
              <View key={c.id} style={s.tr}>
                <Text style={{ flex: 1.4, fontFamily: 'Helvetica-Bold' }}>{c.title}</Text>
                <Text style={[{ flex: 3, paddingRight: 6 }, s.muted]}>{c.detail}</Text>
                <Text style={[{ flex: 1.3 }, s.right]}>{c.from ? `${c.from} to ${c.to}` : '-'}</Text>
              </View>
            ))}
          </Section>

          <Section n={11} title="Recommendations and actions">
            <ActionsPdf plan={plan} adviserName={adviserName} />
          </Section>
        </View>

        {letter ? (
          <View style={s.body} break>
            <Section n={12} title="Covering letter">
              <Text style={s.letter}>{letter}</Text>
            </Section>
          </View>
        ) : null}

        <View style={s.body} wrap={false}>
          <View style={s.section}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Important information</Text>
            <Text style={s.note}>
              The value of investments and any income from them can fall as well as rise, and you may get back less than you invested. Past
              performance is not a reliable indicator of future results. Figures are valuations at the dates shown and are drawn from:{' '}
              {sources.join('; ')}.
            </Text>
            <Text style={s.note}>
              This report is a summary of your arrangements for review purposes and does not constitute a personal recommendation. {ADVISER.firm} is
              authorised and regulated by the Financial Conduct Authority.
            </Text>
            <View style={{ marginTop: 22, width: 200, borderBottomWidth: 0.5, borderBottomColor: INK }} />
            <Text style={{ marginTop: 3 }}>{adviserName}, Financial Adviser</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            {ADVISER.firm} · {reference} · {issuedOn}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export function renderReportPdf(input: ReportPdfInput) {
  return renderToBuffer(<ReportDocument {...input} />)
}
