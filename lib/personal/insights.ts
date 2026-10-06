import type { AllocationSlice, Goal } from '@/lib/personal/data'
import type { HoldingRow, NetWorth, PersonalProfile } from '@/lib/personal/store'
import { formatCompactGBP, formatGBP } from '@/lib/personal/format'

/**
 * Pure, per-user analytics derived from the data the user has entered.
 * No market-data feed and no fabricated figures — everything here is computed
 * from the user's own accounts, holdings and goals.
 */

export type PersonalInput = {
  netWorth: NetWorth
  portfolio: { value: number }
  holdings: HoldingRow[]
  allocation: { asset: AllocationSlice[]; geography: AllocationSlice[]; currency: AllocationSlice[] }
  goals: Goal[]
  profile: PersonalProfile
}

const TAX_WRAPPERS = ['ISA', 'SIPP', 'Pension']

function topHolding(holdings: HoldingRow[]) {
  return holdings.length ? [...holdings].sort((a, b) => b.value - a.value)[0] : null
}

function topSector(holdings: HoldingRow[]) {
  const map = new Map<string, number>()
  for (const h of holdings) map.set(h.sector, (map.get(h.sector) ?? 0) + h.value)
  let best: { sector: string; value: number } | null = null
  for (const [sector, value] of map) if (!best || value > best.value) best = { sector, value }
  return best
}

function taxAdvantagedShare(holdings: HoldingRow[], portfolioValue: number) {
  if (portfolioValue <= 0) return 0
  const inWrappers = holdings.filter((h) => TAX_WRAPPERS.includes(h.account)).reduce((s, h) => s + h.value, 0)
  return (inWrappers / portfolioValue) * 100
}

function cashMonths(input: PersonalInput) {
  return input.profile.monthlySpending > 0 ? input.netWorth.cash / input.profile.monthlySpending : null
}

/* ------------------------------------------------------------------ */
/* Insights                                                            */
/* ------------------------------------------------------------------ */

export type Insight = {
  id: string
  kind: 'warning' | 'positive' | 'ai' | 'neutral'
  category: 'Concentration' | 'Goals' | 'Currency' | 'Tax' | 'Cash'
  title: string
  body: string
  explanation: string
  href: string
}

export function derivePersonalInsights(input: PersonalInput): Insight[] {
  const { netWorth, portfolio, holdings, allocation, goals } = input
  const pv = portfolio.value
  const out: Insight[] = []

  const top = topHolding(holdings)
  if (top && pv > 0) {
    const w = (top.value / pv) * 100
    if (w >= 10) {
      out.push({
        id: 'concentration',
        kind: 'warning',
        category: 'Concentration',
        title: `${top.name} is ${w.toFixed(0)}% of your portfolio`,
        body: 'A single holding above 10% makes your outcome depend heavily on one company.',
        explanation: `${top.name} is worth ${formatGBP(top.value)} of a ${formatGBP(pv)} portfolio. Trimming it toward a 10% ceiling reduces the impact of a company-specific fall.`,
        href: '/me/portfolio?tab=holdings',
      })
    }
  }

  const sector = topSector(holdings)
  if (sector && pv > 0) {
    const w = (sector.value / pv) * 100
    if (w >= 30 && sector.sector !== 'Diversified') {
      out.push({
        id: 'sector',
        kind: 'warning',
        category: 'Concentration',
        title: `${sector.sector} is ${w.toFixed(0)}% of your portfolio`,
        body: 'Holdings in the same sector tend to rise and fall together.',
        explanation: `Your ${sector.sector} holdings total ${formatGBP(sector.value)}. Spreading across more sectors lowers how much a single theme moves your portfolio.`,
        href: '/me/portfolio?tab=allocation',
      })
    }
  }

  const topCur = allocation.currency[0]
  if (topCur && topCur.value >= 50 && topCur.name !== 'GBP') {
    out.push({
      id: 'currency',
      kind: 'warning',
      category: 'Currency',
      title: `${topCur.value}% of your investments are in ${topCur.name}`,
      body: 'A large single-currency weighting adds exchange-rate risk if you spend in another currency.',
      explanation: `If most of your future spending is in GBP, a stronger pound would reduce the sterling value of your ${topCur.name} assets. Consider some GBP-denominated or hedged holdings.`,
      href: '/me/portfolio?tab=allocation',
    })
  }

  const behind = goals.filter((g) => g.probability < 60).sort((a, b) => a.probability - b.probability)[0]
  if (behind) {
    out.push({
      id: `goal-${behind.id}`,
      kind: 'warning',
      category: 'Goals',
      title: `${behind.name} is ${behind.status.toLowerCase()}`,
      body: `Estimated ${behind.probability}% chance of reaching ${formatCompactGBP(behind.target)} by ${behind.targetDate}.`,
      explanation: `Increasing the monthly contribution (currently ${formatGBP(behind.monthly)}) or extending the target date would raise the probability. Projections assume a ${behind.expectedReturn.toFixed(1)}% annual return.`,
      href: `/me/goals/${behind.id}`,
    })
  }

  const ahead = goals.filter((g) => g.probability >= 85).sort((a, b) => b.probability - a.probability)[0]
  if (ahead) {
    out.push({
      id: `goal-ahead-${ahead.id}`,
      kind: 'positive',
      category: 'Goals',
      title: `${ahead.name} is on track`,
      body: `Estimated ${ahead.probability}% chance of reaching ${formatCompactGBP(ahead.target)} by ${ahead.targetDate}.`,
      explanation: 'At your current contribution and assumed return, this goal is comfortably funded. You could redirect surplus toward a goal that needs attention.',
      href: `/me/goals/${ahead.id}`,
    })
  }

  const months = cashMonths(input)
  if (months !== null) {
    if (months < 3) {
      out.push({
        id: 'cash-low',
        kind: 'warning',
        category: 'Cash',
        title: `Your cash covers ${months.toFixed(1)} months of spending`,
        body: 'An emergency fund of 3–6 months of expenses cushions you against surprises.',
        explanation: `At ${formatGBP(input.profile.monthlySpending)}/month of spending, building cash toward three months reduces the chance of having to sell investments at a bad time.`,
        href: '/me/accounts',
      })
    } else if (months > 12) {
      out.push({
        id: 'cash-high',
        kind: 'ai',
        category: 'Cash',
        title: `Your cash covers ${months.toFixed(0)} months of spending`,
        body: 'Cash well above an emergency buffer can lose value to inflation over time.',
        explanation: `Holding more than a year of expenses in cash is safe but tends to lag investment returns. You could put some of it toward your goals.`,
        href: '/me/portfolio',
      })
    }
  }

  if (pv > 0) {
    const share = taxAdvantagedShare(holdings, pv)
    if (share < 50) {
      out.push({
        id: 'tax',
        kind: 'ai',
        category: 'Tax',
        title: `${share.toFixed(0)}% of your investments are in tax wrappers`,
        body: 'ISAs and pensions shelter growth and income from tax.',
        explanation: 'Moving eligible holdings into an ISA or pension (within annual allowances) shelters future growth and dividends from tax.',
        href: '/me/portfolio?tab=holdings',
      })
    }
  }

  return out
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export type Opportunity = {
  id: string
  title: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  rationale: string
  action: string
  href: string
}

export function derivePersonalOpportunities(input: PersonalInput): Opportunity[] {
  const { netWorth, portfolio, holdings, allocation, goals } = input
  const pv = portfolio.value
  const out: Opportunity[] = []

  const top = topHolding(holdings)
  if (top && pv > 0) {
    const w = (top.value / pv) * 100
    if (w >= 10) {
      out.push({
        id: 'trim-concentration',
        title: `Reduce ${top.name} concentration`,
        category: 'Risk',
        priority: w >= 20 ? 'High' : 'Medium',
        rationale: `${top.name} is ${w.toFixed(0)}% of your portfolio (${formatGBP(top.value)}).`,
        action: `Trim toward a 10% ceiling and redirect proceeds into a diversified fund.`,
        href: '/me/portfolio?tab=holdings',
      })
    }
  }

  const behind = goals.filter((g) => g.probability < 70).sort((a, b) => a.probability - b.probability)[0]
  if (behind) {
    out.push({
      id: `fund-${behind.id}`,
      title: `Increase funding for ${behind.name}`,
      category: 'Goals',
      priority: behind.probability < 50 ? 'High' : 'Medium',
      rationale: `${behind.name} has a ${behind.probability}% chance of reaching ${formatCompactGBP(behind.target)} by ${behind.targetDate}.`,
      action: `Raise the monthly contribution above ${formatGBP(behind.monthly)} or extend the target date.`,
      href: `/me/goals/${behind.id}`,
    })
  }

  const months = cashMonths(input)
  if (months !== null && months > 9) {
    out.push({
      id: 'deploy-cash',
      title: 'Put excess cash to work',
      category: 'Cash',
      priority: 'Medium',
      rationale: `Your cash (${formatGBP(netWorth.cash)}) covers about ${months.toFixed(0)} months of spending.`,
      action: 'Invest the amount above a 6-month buffer in line with your risk profile.',
      href: '/me/portfolio',
    })
  }

  if (pv > 0 && taxAdvantagedShare(holdings, pv) < 50) {
    out.push({
      id: 'use-wrappers',
      title: 'Use your ISA and pension allowances',
      category: 'Tax',
      priority: 'Medium',
      rationale: 'Less than half of your investments are inside tax wrappers.',
      action: 'Move eligible holdings into an ISA or pension to shelter growth from tax.',
      href: '/me/portfolio?tab=holdings',
    })
  }

  const topCur = allocation.currency[0]
  if (topCur && topCur.value >= 50 && topCur.name !== 'GBP') {
    out.push({
      id: 'diversify-currency',
      title: 'Diversify your currency exposure',
      category: 'Risk',
      priority: 'Medium',
      rationale: `${topCur.value}% of your investments are priced in ${topCur.name}.`,
      action: 'Add GBP-denominated or currency-hedged holdings to match your spending.',
      href: '/me/portfolio?tab=allocation',
    })
  }

  if (pv > 0 && holdings.length > 0 && holdings.length < 5) {
    out.push({
      id: 'diversify-holdings',
      title: 'Broaden your diversification',
      category: 'Risk',
      priority: 'Medium',
      rationale: `You hold ${holdings.length} position${holdings.length === 1 ? '' : 's'}.`,
      action: 'A single low-cost global index fund adds thousands of companies in one holding.',
      href: '/me/portfolio?tab=holdings',
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'well-positioned',
      title: 'Your portfolio looks well balanced',
      category: 'Review',
      priority: 'Low',
      rationale: 'No concentration, cash or tax flags from the data you have entered.',
      action: 'Keep contributions steady and review again after any large change.',
      href: '/me/portfolio',
    })
  }

  return out
}

/* ------------------------------------------------------------------ */
/* Scenario engine                                                     */
/* ------------------------------------------------------------------ */

export type Shock = {
  id: string
  label: string
  group: 'Markets' | 'Life'
  /** Returns the (usually negative) change in net worth this shock causes. */
  delta: (holdings: HoldingRow[], netWorth: NetWorth) => number
}

const sumWhere = (holdings: HoldingRow[], pred: (h: HoldingRow) => boolean) =>
  holdings.filter(pred).reduce((s, h) => s + h.value, 0)

export const SHOCKS: Shock[] = [
  { id: 'equities-20', label: 'Global equities −20%', group: 'Markets', delta: (h) => -sumWhere(h, (x) => x.assetClass === 'Equity') * 0.2 },
  { id: 'alts-25', label: 'Alternatives −25%', group: 'Markets', delta: (h) => -sumWhere(h, (x) => x.assetClass === 'Alternatives') * 0.25 },
  { id: 'bonds-10', label: 'Bonds −10%', group: 'Markets', delta: (h) => -sumWhere(h, (x) => x.assetClass === 'Bonds') * 0.1 },
  { id: 'property-15', label: 'Property −15%', group: 'Markets', delta: (_h, nw) => -nw.property * 0.15 },
  { id: 'gbp-10', label: 'GBP strengthens 10%', group: 'Markets', delta: (h) => -sumWhere(h, (x) => x.currency !== 'GBP') * 0.1 },
]

export type ScenarioResult = {
  picked: Shock[]
  delta: number
  netWorth: number
  drawdownPct: number
}

export function runScenario(holdings: HoldingRow[], netWorth: NetWorth, shockIds: string[]): ScenarioResult {
  const picked = SHOCKS.filter((s) => shockIds.includes(s.id))
  const delta = picked.reduce((a, s) => a + s.delta(holdings, netWorth), 0)
  return {
    picked,
    delta,
    netWorth: netWorth.total + delta,
    drawdownPct: netWorth.total > 0 ? (delta / netWorth.total) * 100 : 0,
  }
}

/* ------------------------------------------------------------------ */
/* Grounded advisor answers                                            */
/* ------------------------------------------------------------------ */

export type AdvisorAnswer = {
  summary: string
  facts: string[]
  assumptions: string[]
  analysis: string[]
  actions: string[]
  confidence: 'High' | 'Moderate' | 'Low'
}

export const suggestedQuestions = [
  'Where am I overexposed?',
  'Am I on track for my goals?',
  'What happens if global equities fall 20%?',
  'Do I have too much cash?',
  'How tax-efficient is my portfolio?',
  'What should I focus on first?',
]

function baseFacts(input: PersonalInput): string[] {
  const { netWorth, portfolio, holdings, allocation, goals } = input
  const facts: string[] = [
    `Net worth is ${formatGBP(netWorth.total)} — ${formatGBP(netWorth.investments)} invested and ${formatGBP(netWorth.cash)} in cash.`,
  ]
  const top = topHolding(holdings)
  if (top && portfolio.value > 0) facts.push(`Largest holding: ${top.name} at ${((top.value / portfolio.value) * 100).toFixed(0)}% of the portfolio.`)
  const topAsset = allocation.asset[0]
  if (topAsset) facts.push(`Largest asset class: ${topAsset.name} at ${topAsset.value}%.`)
  const months = cashMonths(input)
  if (months !== null) facts.push(`Cash covers about ${months.toFixed(1)} months of spending.`)
  if (goals.length) {
    const worst = [...goals].sort((a, b) => a.probability - b.probability)[0]
    facts.push(`${goals.length} goal${goals.length === 1 ? '' : 's'}; lowest is ${worst.name} at ${worst.probability}%.`)
  }
  return facts
}

export function answerFromSnapshot(input: PersonalInput | undefined, question: string): AdvisorAnswer {
  const q = question.toLowerCase()
  const confidence: AdvisorAnswer['confidence'] = 'Moderate'
  const assumptions = ['Based only on the data you have entered.', 'Projections use your stated contributions and assumed returns.']

  if (!input || input.portfolio.value === 0) {
    return {
      summary: 'Add your accounts, holdings and goals and I can answer this with your real numbers.',
      facts: ['No portfolio data has been entered yet.'],
      assumptions,
      analysis: ['I only use the data you provide — nothing is assumed about your finances.'],
      actions: ['Add an account or holding, or load the sample portfolio to explore.'],
      confidence: 'Low',
    }
  }

  const facts = baseFacts(input)
  const insights = derivePersonalInsights(input)
  const opps = derivePersonalOpportunities(input)

  const concentrationInsight = insights.find((i) => i.category === 'Concentration')
  const goalInsight = insights.find((i) => i.category === 'Goals' && i.kind === 'warning')

  if (/overexpos|concentrat|risk|exposure/.test(q)) {
    return {
      summary: concentrationInsight
        ? concentrationInsight.title + '.'
        : 'No single holding or sector dominates your portfolio.',
      facts,
      assumptions,
      analysis: insights.filter((i) => i.category === 'Concentration' || i.category === 'Currency').map((i) => i.explanation),
      actions: opps.filter((o) => o.category === 'Risk').map((o) => o.action),
      confidence,
    }
  }

  if (/retire|freedom|early|on track|goal/.test(q)) {
    const g = input.goals
    return {
      summary: g.length
        ? `${g.filter((x) => x.probability >= 70).length} of ${g.length} goals are on track or ahead.`
        : 'You have not set any goals yet.',
      facts,
      assumptions,
      analysis: g.map((x) => `${x.name}: ${x.probability}% chance of ${formatCompactGBP(x.target)} by ${x.targetDate}.`),
      actions: goalInsight ? [goalInsight.explanation] : ['Keep contributions steady; your goals are on track.'],
      confidence,
    }
  }

  if (/cash|emergency|buffer/.test(q)) {
    const months = cashMonths(input)
    return {
      summary: months === null ? 'Set your monthly spending to assess your cash buffer.' : `Your cash covers about ${months.toFixed(1)} months of spending.`,
      facts,
      assumptions,
      analysis: insights.filter((i) => i.category === 'Cash').map((i) => i.explanation),
      actions: opps.filter((o) => o.category === 'Cash').map((o) => o.action),
      confidence,
    }
  }

  if (/tax|isa|pension|wrapper/.test(q)) {
    return {
      summary: `${taxAdvantagedShare(input.holdings, input.portfolio.value).toFixed(0)}% of your investments are inside tax wrappers.`,
      facts,
      assumptions,
      analysis: insights.filter((i) => i.category === 'Tax').map((i) => i.explanation),
      actions: opps.filter((o) => o.category === 'Tax').map((o) => o.action),
      confidence,
    }
  }

  if (/fall|crash|down|drop|scenario|what if|stress/.test(q)) {
    const result = runScenario(input.holdings, input.netWorth, ['equities-20'])
    return {
      summary: `A 20% fall in global equities would reduce your net worth by about ${formatGBP(Math.abs(result.delta))} (${result.drawdownPct.toFixed(1)}%).`,
      facts,
      assumptions: [...assumptions, 'Assumes only the selected shock, with other assets unchanged.'],
      analysis: [
        `Equity holdings would fall by about ${formatGBP(Math.abs(result.delta))}.`,
        'Cash and bonds would cushion the fall and keep your short-term spending covered.',
      ],
      actions: ['Use the scenario simulator below to combine shocks.', 'Avoid selling into a decline unless you need the cash.'],
      confidence,
    }
  }

  return {
    summary: opps[0] ? opps[0].title + '.' : 'Your portfolio looks balanced against the data you have entered.',
    facts,
    assumptions,
    analysis: insights.slice(0, 3).map((i) => i.explanation),
    actions: opps.slice(0, 3).map((o) => o.action),
    confidence,
  }
}
