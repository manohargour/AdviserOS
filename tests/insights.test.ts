import { describe, expect, it } from 'vitest'
import {
  answerFromSnapshot,
  derivePersonalInsights,
  derivePersonalOpportunities,
  runScenario,
  type PersonalInput,
} from '@/lib/personal/insights'
import type { HoldingRow, NetWorth } from '@/lib/personal/store'

function holding(partial: Partial<HoldingRow> & { value: number }): HoldingRow {
  return {
    id: partial.id ?? 1,
    name: partial.name ?? 'Test Holding',
    ticker: partial.ticker ?? 'TST',
    value: partial.value,
    returnPct: partial.returnPct ?? 0,
    dayPct: partial.dayPct ?? 0,
    account: partial.account ?? 'GIA',
    goal: partial.goal ?? '',
    sector: partial.sector ?? 'Diversified',
    region: partial.region ?? 'Global',
    assetClass: partial.assetClass ?? 'Equity',
    currency: partial.currency ?? 'GBP',
    aiView: partial.aiView ?? { tone: 'neutral', label: 'Holding' },
  }
}

const netWorth: NetWorth = {
  total: 100_000,
  monthChange: 0,
  monthChangePct: 0,
  investments: 100_000,
  property: 0,
  cash: 0,
  liabilities: 0,
}

function input(holdings: HoldingRow[], overrides: Partial<PersonalInput> = {}): PersonalInput {
  const value = holdings.reduce((s, h) => s + h.value, 0)
  return {
    netWorth: { ...netWorth, total: value, investments: value },
    portfolio: { value },
    holdings,
    allocation: { asset: [], geography: [], currency: [] },
    goals: [],
    profile: { firstName: 'Test', fullName: 'Test User', email: 't@example.com', initials: 'TU', riskProfile: 'Balanced', riskScore: 5, age: 40, monthlySpending: 2000 },
    ...overrides,
  }
}

describe('derivePersonalInsights', () => {
  it('flags a single holding above 10% as a concentration warning', () => {
    const insights = derivePersonalInsights(input([holding({ id: 1, name: 'Big', value: 60_000 }), holding({ id: 2, name: 'Small', value: 40_000 })]))
    const concentration = insights.find((i) => i.id === 'concentration')
    expect(concentration).toBeDefined()
    expect(concentration?.kind).toBe('warning')
    expect(concentration?.title).toContain('Big')
  })

  it('does not flag concentration when well diversified', () => {
    const holdings = Array.from({ length: 20 }, (_, i) => holding({ id: i, value: 5_000, sector: `S${i}` }))
    const insights = derivePersonalInsights(input(holdings))
    expect(insights.find((i) => i.id === 'concentration')).toBeUndefined()
  })
})

describe('derivePersonalOpportunities', () => {
  it('returns a high-priority trim when one holding exceeds 20%', () => {
    const opps = derivePersonalOpportunities(input([holding({ id: 1, name: 'Mega', value: 80_000 }), holding({ id: 2, value: 20_000 })]))
    const trim = opps.find((o) => o.id === 'trim-concentration')
    expect(trim?.priority).toBe('High')
  })

  it('always returns at least one opportunity', () => {
    const opps = derivePersonalOpportunities(input([holding({ id: 1, value: 50_000 }), holding({ id: 2, value: 50_000 })]))
    expect(opps.length).toBeGreaterThan(0)
  })
})

describe('runScenario', () => {
  it('reduces net worth by 20% of equity value for an equities shock', () => {
    const holdings = [holding({ id: 1, value: 50_000, assetClass: 'Equity' }), holding({ id: 2, value: 50_000, assetClass: 'Bonds' })]
    const nw: NetWorth = { ...netWorth, total: 100_000 }
    const r = runScenario(holdings, nw, ['equities-20'])
    expect(r.delta).toBe(-10_000)
    expect(r.netWorth).toBe(90_000)
    expect(r.drawdownPct).toBeCloseTo(-10, 5)
  })

  it('returns no change when no shocks are selected', () => {
    const r = runScenario([holding({ id: 1, value: 10_000 })], { ...netWorth, total: 10_000 }, [])
    expect(r.delta).toBe(0)
  })
})

describe('answerFromSnapshot', () => {
  it('returns low confidence when there is no data', () => {
    const answer = answerFromSnapshot(undefined, 'where am I overexposed?')
    expect(answer.confidence).toBe('Low')
  })

  it('grounds a concentration answer in real figures', () => {
    const answer = answerFromSnapshot(input([holding({ id: 1, name: 'Big', value: 70_000 }), holding({ id: 2, value: 30_000 })]), 'where am I overexposed?')
    expect(answer.summary).toContain('Big')
    expect(answer.facts.join(' ')).toContain('Net worth')
  })
})
