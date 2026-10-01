import 'server-only'

import { Document, Page, Path, Rect, StyleSheet, Svg, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { ADVISER, allocation, equityPct, gbp, type AssetClass, type Client } from '@/lib/data'

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

          <Section n={3} title="Asset allocation">
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
          <Section n={4} title="Holdings">
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

          <Section n={5} title="Goals">
            {client.goals.map((g) => (
              <View key={g.title} style={{ marginBottom: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{g.title}</Text>
                  <Text style={s.muted}>
                    {g.target} · {g.horizon} · {g.progress}%
                  </Text>
                </View>
                <Svg width={507} height={5} style={{ marginTop: 3 }}>
                  <Rect x={0} y={0} width={507} height={5} fill="#efece5" />
                  <Rect x={0} y={0} width={(507 * Math.min(100, g.progress)) / 100} height={5} fill={BRASS} />
                </Svg>
              </View>
            ))}
          </Section>

          <Section n={6} title="Changes since last review">
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
        </View>

        {letter ? (
          <View style={s.body} break>
            <Section n={7} title="Covering letter">
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
