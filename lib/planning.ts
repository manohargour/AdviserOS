import { equityPct, gbp, type AssetClass, type Client } from '@/lib/data'

export const TAX_YEAR = '2026/27'
export const PROJECTION_YEARS = 10

function seeded(id: string, salt: number) {
  let h = 2166136261 ^ salt
  for (const ch of id) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

const round = (n: number, step = 1) => Math.round(n / step) * step
const geometric = (returns: number[]) => (Math.pow(returns.reduce((acc, r) => acc * (1 + r / 100), 1), 1 / returns.length) - 1) * 100

export const MODEL_RANGES: Record<number, [number, number]> = {
  1: [0, 10],
  2: [10, 20],
  3: [20, 35],
  4: [35, 45],
  5: [45, 60],
  6: [60, 75],
  7: [70, 85],
  8: [80, 95],
  9: [90, 100],
  10: [95, 100],
}

const STRESS: Record<AssetClass, number> = { Equity: -0.3, Bonds: -0.08, Property: -0.2, Alternatives: -0.15, Cash: 0 }
const VOLATILITY: Record<AssetClass, number> = { Equity: 16, Bonds: 6, Property: 12, Alternatives: 9, Cash: 0.5 }
const FUND_OCF: Record<AssetClass, number> = { Equity: 0.16, Bonds: 0.12, Property: 0.4, Alternatives: 0.65, Cash: 0 }
const PLATFORM_FEE: Record<string, number> = { Transact: 0.29, Quilter: 0.3, 'abrdn Wrap': 0.3, Fidelity: 0.25 }
const ADVICE_FEE = 0.5
const TRANSACTION_COST = 0.06

const CALENDAR = [
  { year: 2021, growth: 17.2, defensive: -2.1 },
  { year: 2022, growth: -7.8, defensive: -11.6 },
  { year: 2023, growth: 12.4, defensive: 4.8 },
  { year: 2024, growth: 15.1, defensive: 2.2 },
  { year: 2025, growth: 11.6, defensive: 5.1 },
]
const TRAILING_12M = { growth: 9.4, defensive: 3.8 }

export type Alignment = 'Within range' | 'Above range' | 'Below range'
export type GoalStatus = 'Achieved' | 'On track' | 'Monitor' | 'Behind'
export type Priority = 'High' | 'Medium' | 'Low'

export type Plan = ReturnType<typeof planFor>

function benchmarkName(equity: number) {
  if (equity < 35) return 'IA Mixed Investment 0–35% Shares'
  if (equity < 60) return 'IA Mixed Investment 20–60% Shares'
  if (equity < 85) return 'IA Mixed Investment 40–85% Shares'
  return 'IA Flexible Investment'
}

export function goalStatus(progress: number): GoalStatus {
  if (progress >= 100) return 'Achieved'
  if (progress >= 75) return 'On track'
  if (progress >= 50) return 'Monitor'
  return 'Behind'
}

export function planFor(client: Client) {
  const value = client.portfolioValue
  const equity = equityPct(client)
  const share = equity / 100
  const byClass = client.holdings.reduce<Partial<Record<AssetClass, number>>>(
    (acc, h) => ({ ...acc, [h.assetClass]: (acc[h.assetClass] ?? 0) + h.value }),
    {},
  )
  const weighted = (table: Record<AssetClass, number>) =>
    (Object.entries(byClass) as [AssetClass, number][]).reduce((sum, [k, v]) => sum + (table[k] * v) / value, 0)

  // Risk & suitability
  const [modelMin, modelMax] = MODEL_RANGES[client.risk.score] ?? [40, 60]
  const alignment: Alignment = equity > modelMax + 0.5 ? 'Above range' : equity < modelMin - 0.5 ? 'Below range' : 'Within range'
  const capacityForLoss = client.age >= 65 ? 'Low' : client.age >= 55 ? 'Medium' : 'High'
  const capacityNote =
    capacityForLoss === 'Low'
      ? 'Drawing or close to drawing on the portfolio; limited time to recover from a fall.'
      : capacityForLoss === 'Medium'
        ? 'Within ten years of retirement; some time to recover, but losses would affect plans.'
        : 'Long investment horizon and earned income; a fall would not change lifestyle.'
  const stressPct = weighted(STRESS) * 100
  const stressLoss = (value * stressPct) / 100
  const volatility = weighted(VOLATILITY)
  const rebalanceAmount = alignment === 'Above range' ? ((equity - modelMax) / 100) * value : alignment === 'Below range' ? ((modelMin - equity) / 100) * value : 0
  const profile = `${client.risk.label} (${client.risk.score}/10)`
  const statement =
    alignment === 'Within range'
      ? `Equity exposure of ${equity.toFixed(0)}% sits within the ${modelMin}–${modelMax}% range for a ${profile} profile. Taken with a ${capacityForLoss.toLowerCase()} capacity for loss, the current strategy remains suitable.`
      : alignment === 'Above range'
        ? `Equity exposure of ${equity.toFixed(0)}% is above the ${modelMin}–${modelMax}% range for a ${profile} profile. The portfolio is taking more risk than agreed and should be rebalanced before the strategy is confirmed as suitable.`
        : `Equity exposure of ${equity.toFixed(0)}% is below the ${modelMin}–${modelMax}% range for a ${profile} profile. The portfolio may not deliver the growth your objectives need.`

  // Costs & charges
  const platformFee = PLATFORM_FEE[client.holdings[0]?.platform ?? ''] ?? 0.25
  const fundOcf = weighted(FUND_OCF)
  const costLines = [
    { label: 'Fund charges (OCF)', pct: fundOcf },
    { label: 'Platform fee', pct: platformFee },
    { label: 'Ongoing advice fee', pct: ADVICE_FEE },
    { label: 'Transaction costs', pct: TRANSACTION_COST },
  ].map((l) => ({ ...l, amount: (value * l.pct) / 100 }))
  const totalCostPct = costLines.reduce((s, l) => s + l.pct, 0)
  const totalCost = (value * totalCostPct) / 100

  // Projections
  const grossGrowth = 2 + 5 * share
  const central = grossGrowth - totalCostPct
  const rates = { weak: central - 3, central, strong: central + 2.5 }
  const startYear = 2026
  const projection = Array.from({ length: PROJECTION_YEARS + 1 }, (_, i) => ({
    year: startYear + i,
    weak: round(value * Math.pow(1 + rates.weak / 100, i), 100),
    central: round(value * Math.pow(1 + rates.central / 100, i), 100),
    strong: round(value * Math.pow(1 + rates.strong / 100, i), 100),
  }))
  const chargesEffect = value * (Math.pow(1 + grossGrowth / 100, PROJECTION_YEARS) - Math.pow(1 + central / 100, PROJECTION_YEARS))
  const goals = client.goals.map((g) => ({ ...g, status: goalStatus(g.progress) }))

  // Performance vs benchmark
  const calendar = CALENDAR.map((c) => {
    const benchmark = c.growth * share + c.defensive * (1 - share)
    const portfolio = benchmark + (seeded(client.id, c.year) - 0.45) * 2.4
    return { year: String(c.year), portfolio: Number(portfolio.toFixed(1)), benchmark: Number(benchmark.toFixed(1)) }
  })
  const bench12 = TRAILING_12M.growth * share + TRAILING_12M.defensive * (1 - share)
  const port12 = bench12 + (seeded(client.id, 12) - 0.45) * 2.4
  const periods = [
    { label: '12 months', portfolio: port12, benchmark: bench12 },
    { label: '3 years p.a.', portfolio: geometric(calendar.slice(-3).map((c) => c.portfolio)), benchmark: geometric(calendar.slice(-3).map((c) => c.benchmark)) },
    { label: '5 years p.a.', portfolio: geometric(calendar.map((c) => c.portfolio)), benchmark: geometric(calendar.map((c) => c.benchmark)) },
  ].map((p) => ({ ...p, relative: p.portfolio - p.benchmark }))

  // Tax wrappers & allowances
  const cash = byClass.Cash ?? 0
  const invested = value - cash
  const pensionShare = client.age < 60 ? 0.52 : client.age < 67 ? 0.42 : 0.3
  const isaShare = 0.24 + seeded(client.id, 3) * 0.1
  const pension = round(invested * pensionShare, 100)
  const isa = round(invested * isaShare, 100)
  const gia = invested - pension - isa
  const wrappers = [
    { name: 'Pension (SIPP)', value: pension, treatment: 'Tax-relieved contributions; 25% tax-free cash, remainder taxed as income.' },
    { name: 'Stocks & Shares ISA', value: isa, treatment: 'Growth and income free of income tax and CGT.' },
    { name: 'General investment account', value: gia, treatment: 'Gains subject to CGT; dividends and interest taxable.' },
    { name: 'Cash', value: cash, treatment: 'Interest covered by the personal savings allowance.' },
  ].map((w) => ({ ...w, pct: (w.value / value) * 100 }))
  const isaFlagged = client.outstanding.some((o) => /ISA/i.test(o.title))
  const giaGain = round(gia * (0.12 + seeded(client.id, 5) * 0.1), 100)
  const allowances = [
    { name: 'ISA subscription', limit: 20000, used: isaFlagged ? 0 : round(seeded(client.id, 7) * 20000, 1000) },
    { name: 'Pension annual allowance', limit: 60000, used: client.age >= 75 ? 0 : round(seeded(client.id, 9) * 40000, 500) },
    { name: 'CGT annual exempt amount', limit: 3000, used: round(seeded(client.id, 11) * 3000, 100) },
    { name: 'Dividend allowance', limit: 500, used: Math.min(500, round(gia * 0.0025, 10)) },
  ].map((a) => ({ ...a, remaining: Math.max(0, a.limit - a.used) }))
  const allowance = (name: string) => allowances.find((a) => a.name === name)!

  // Recommendations & actions
  const actions: { title: string; rationale: string; owner: 'Adviser' | 'Client'; priority: Priority; timing: string }[] = []
  if (alignment === 'Above range')
    actions.push({
      title: `Rebalance to the ${client.risk.label} model`,
      rationale: `Equity is ${equity.toFixed(0)}% against a ${modelMin}–${modelMax}% range. Moving about ${gbp(round(rebalanceAmount, 1000))} into defensive assets brings the portfolio back within range.`,
      owner: 'Adviser',
      priority: 'High',
      timing: 'Within 30 days',
    })
  if (alignment === 'Below range')
    actions.push({
      title: 'Review the level of growth assets',
      rationale: `Equity is ${equity.toFixed(0)}% against a ${modelMin}–${modelMax}% range. About ${gbp(round(rebalanceAmount, 1000))} could move into growth assets.`,
      owner: 'Adviser',
      priority: 'Medium',
      timing: 'At review meeting',
    })
  const isaLeft = allowance('ISA subscription').remaining
  if (isaLeft > 0)
    actions.push({
      title: `Use the remaining ${TAX_YEAR} ISA allowance`,
      rationale: `${gbp(isaLeft)} of the ${gbp(20000)} allowance remains.${gia > 0 ? ' A Bed & ISA from the general account would shelter future growth.' : ''}`,
      owner: 'Client',
      priority: 'Medium',
      timing: 'Before 5 April 2027',
    })
  const cgtLeft = allowance('CGT annual exempt amount').remaining
  if (cgtLeft > 0 && giaGain > 0)
    actions.push({
      title: 'Realise gains within the CGT exempt amount',
      rationale: `The general account holds an estimated ${gbp(giaGain)} of unrealised gains; ${gbp(cgtLeft)} can be realised tax-free this year.`,
      owner: 'Adviser',
      priority: 'Low',
      timing: 'Before 5 April 2027',
    })
  const pensionLeft = allowance('Pension annual allowance').remaining
  if (pensionLeft > 10000 && client.age < 75)
    actions.push({
      title: 'Consider further pension contributions',
      rationale: `${gbp(pensionLeft)} of annual allowance is unused, with tax relief at your marginal rate.`,
      owner: 'Client',
      priority: client.age < 60 ? 'Medium' : 'Low',
      timing: 'Before 5 April 2027',
    })
  for (const g of goals.filter((g) => g.status === 'Behind'))
    actions.push({
      title: `Review funding for “${g.title}”`,
      rationale: `Currently ${g.progress}% funded against ${g.target}. Contributions or the target date may need to change.`,
      owner: 'Adviser',
      priority: 'Medium',
      timing: 'At review meeting',
    })
  const threeYear = periods[1]
  if (threeYear.relative < -0.5)
    actions.push({
      title: 'Review funds lagging the benchmark',
      rationale: `The portfolio is ${Math.abs(threeYear.relative).toFixed(1)}% a year behind the ${benchmarkName(equity)} sector over three years.`,
      owner: 'Adviser',
      priority: 'Medium',
      timing: 'Within 30 days',
    })
  for (const o of client.outstanding)
    actions.push({ title: o.title, rationale: o.detail, owner: o.kind === 'client' ? 'Client' : 'Adviser', priority: 'Medium', timing: 'Before sign-off' })
  if (actions.length === 0)
    actions.push({ title: 'Maintain the current strategy', rationale: 'No changes are needed this year.', owner: 'Adviser', priority: 'Low', timing: 'Next review' })
  const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }
  actions.sort((a, b) => order[a.priority] - order[b.priority])

  return {
    risk: { modelMin, modelMax, equity, alignment, capacityForLoss, capacityNote, stressPct, stressLoss, volatility, rebalanceAmount, statement },
    goals: { goals, projection, rates, assumptions: `Growth of ${rates.weak.toFixed(1)}%, ${rates.central.toFixed(1)}% and ${rates.strong.toFixed(1)}% a year after charges. No further contributions or withdrawals.` },
    tax: { wrappers, allowances, giaGain, taxYear: TAX_YEAR },
    performance: { benchmark: benchmarkName(equity), periods, calendar },
    costs: { lines: costLines, totalPct: totalCostPct, total: totalCost, chargesEffect, platform: client.holdings[0]?.platform ?? 'Platform' },
    actions,
  }
}
