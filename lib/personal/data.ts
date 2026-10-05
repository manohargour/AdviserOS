export const user = {
  firstName: 'Manohar',
  fullName: 'Manohar Rao',
  email: 'manohar@meridian.app',
  initials: 'MR',
  riskProfile: 'Balanced growth',
  riskScore: 6,
  age: 38,
}

export const netWorth = {
  total: 824_350,
  monthChange: 34_820,
  monthChangePct: 4.4,
  investments: 612_400,
  property: 265_000,
  cash: 41_950,
  liabilities: -95_000,
}

/* ------------------------------ Time series ------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random walk bridged so it starts and ends at exact values. */
function bridgedSeries(start: number, end: number, n: number, vol: number, seed: number) {
  const rand = mulberry32(seed)
  const walk = [0]
  for (let i = 1; i < n; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 2 * vol)
  const drift = walk[n - 1]
  return walk.map((w, i) => {
    const t = i / (n - 1)
    return start + (end - start) * t + (w - drift * t)
  })
}

export type Period = '1M' | '3M' | '1Y' | '5Y' | 'ALL'

const TODAY = new Date(2026, 8, 29)

function buildSeries(period: Period) {
  const cfg: Record<Period, { points: number; stepDays: number; start: number; vol: number; seed: number }> = {
    '1M': { points: 30, stepDays: 1, start: 789_530, vol: 3_200, seed: 11 },
    '3M': { points: 45, stepDays: 2, start: 762_900, vol: 5_000, seed: 23 },
    '1Y': { points: 52, stepDays: 7, start: 688_400, vol: 8_000, seed: 37 },
    '5Y': { points: 60, stepDays: 30.4, start: 342_000, vol: 12_000, seed: 41 },
    ALL: { points: 90, stepDays: 30.4, start: 118_000, vol: 11_000, seed: 53 },
  }
  const c = cfg[period]
  const values = bridgedSeries(c.start, netWorth.total, c.points, c.vol, c.seed)
  return values.map((v, i) => {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - Math.round((c.points - 1 - i) * c.stepDays))
    return { date: d.toISOString(), value: Math.round(v) }
  })
}

export const netWorthSeries: Record<Period, { date: string; value: number }[]> = {
  '1M': buildSeries('1M'),
  '3M': buildSeries('3M'),
  '1Y': buildSeries('1Y'),
  '5Y': buildSeries('5Y'),
  ALL: buildSeries('ALL'),
}

/* ------------------------------- Allocation ------------------------------ */

export type AllocationSlice = { name: string; value: number; color: string }

export const allocation: Record<'asset' | 'geography' | 'currency' | 'account', AllocationSlice[]> = {
  asset: [
    { name: 'Global Equities', value: 48, color: 'var(--chart-1)' },
    { name: 'Technology / AI', value: 19, color: 'var(--chart-2)' },
    { name: 'Property', value: 17, color: 'var(--chart-3)' },
    { name: 'Cash', value: 5, color: 'var(--chart-6)' },
    { name: 'Gold', value: 4, color: 'var(--chart-4)' },
    { name: 'Bonds', value: 4, color: 'var(--chart-5)' },
    { name: 'Private Investments', value: 3, color: 'var(--chart-7)' },
  ],
  geography: [
    { name: 'United States', value: 52, color: 'var(--chart-1)' },
    { name: 'United Kingdom', value: 18, color: 'var(--chart-2)' },
    { name: 'India', value: 17, color: 'var(--chart-4)' },
    { name: 'Europe', value: 8, color: 'var(--chart-3)' },
    { name: 'Other', value: 5, color: 'var(--chart-6)' },
  ],
  currency: [
    { name: 'USD', value: 51, color: 'var(--chart-1)' },
    { name: 'GBP', value: 29, color: 'var(--chart-2)' },
    { name: 'INR', value: 16, color: 'var(--chart-4)' },
    { name: 'EUR', value: 4, color: 'var(--chart-3)' },
  ],
  account: [
    { name: 'Pension (SIPP / Workplace)', value: 33, color: 'var(--chart-1)' },
    { name: 'General investment', value: 30, color: 'var(--chart-2)' },
    { name: 'ISA', value: 15, color: 'var(--chart-5)' },
    { name: 'India (Demat / MF)', value: 12, color: 'var(--chart-4)' },
    { name: 'Gold & Private', value: 10, color: 'var(--chart-3)' },
  ],
}

export const geography = allocation.geography
export const currency = allocation.currency

/* ------------------------------ Portfolio health ------------------------- */

export const health = {
  score: 82,
  factors: [
    { name: 'Diversification', score: 76, note: 'Tech and single-name exposure above target' },
    { name: 'Goal alignment', score: 91, note: 'Four of five goals on track or ahead' },
    { name: 'Liquidity', score: 88, note: '9.3 months of expenses in accessible cash' },
    { name: 'Tax efficiency', score: 73, note: '£8,500 ISA allowance unused this year' },
    { name: 'Risk concentration', score: 69, note: 'BP and Nvidia ecosystem dominate risk' },
  ],
}

/* -------------------------------- Holdings ------------------------------- */

export type Holding = {
  name: string
  ticker: string
  value: number
  returnPct: number
  dayPct: number
  account: 'ISA' | 'GIA' | 'SIPP' | 'Pension' | 'India MF' | 'Vault' | 'Private'
  goal: string
  sector: string
  region: string
  aiView: { tone: 'positive' | 'neutral' | 'warning' | 'negative'; label: string }
}

export const holdings: Holding[] = [
  { name: 'BP plc', ticker: 'BP.', value: 173_000, returnPct: 6.2, dayPct: 0.4, account: 'Pension', goal: 'Financial Freedom', sector: 'Energy', region: 'UK', aiView: { tone: 'negative', label: 'Concentrated' } },
  { name: 'Vanguard FTSE Global All Cap', ticker: 'VAFTGAG', value: 82_100, returnPct: 22.4, dayPct: 0.6, account: 'ISA', goal: 'Financial Freedom', sector: 'Diversified', region: 'Global', aiView: { tone: 'positive', label: 'Core holding' } },
  { name: 'Nvidia', ticker: 'NVDA', value: 62_400, returnPct: 41.8, dayPct: 1.9, account: 'ISA', goal: 'Financial Freedom', sector: 'Semiconductors', region: 'US', aiView: { tone: 'warning', label: 'Overlapping' } },
  { name: 'India Equity Funds', ticker: 'IN-MF', value: 51_300, returnPct: 14.9, dayPct: -0.3, account: 'India MF', goal: 'India Retirement', sector: 'Diversified', region: 'India', aiView: { tone: 'neutral', label: 'Well sized' } },
  { name: 'L&G Future World Global Equity', ticker: 'LGFWGE', value: 48_600, returnPct: 17.1, dayPct: 0.5, account: 'Pension', goal: 'Financial Freedom', sector: 'Diversified', region: 'Global', aiView: { tone: 'warning', label: 'Hidden tech' } },
  { name: 'Microsoft', ticker: 'MSFT', value: 44_200, returnPct: 18.5, dayPct: 0.8, account: 'GIA', goal: 'Financial Freedom', sector: 'Software', region: 'US', aiView: { tone: 'neutral', label: 'Hold' } },
  { name: 'Vanguard S&P 500', ticker: 'VUSA', value: 38_400, returnPct: 24.6, dayPct: 0.7, account: 'ISA', goal: "Children's Education", sector: 'Diversified', region: 'US', aiView: { tone: 'warning', label: 'Hidden tech' } },
  { name: 'Nebius Group', ticker: 'NBIS', value: 28_500, returnPct: 62.4, dayPct: 3.4, account: 'GIA', goal: 'Financial Freedom', sector: 'AI Infrastructure', region: 'US', aiView: { tone: 'warning', label: 'High volatility' } },
  { name: 'iShares Core Global Aggregate Bond', ticker: 'AGGG', value: 24_500, returnPct: 1.8, dayPct: -0.1, account: 'SIPP', goal: 'Home Purchase', sector: 'Bonds', region: 'Global', aiView: { tone: 'positive', label: 'Stabiliser' } },
  { name: 'Physical Gold', ticker: 'XAU', value: 18_200, returnPct: 28.3, dayPct: -0.2, account: 'Vault', goal: 'Financial Freedom', sector: 'Commodities', region: 'Global', aiView: { tone: 'positive', label: 'Hedge' } },
  { name: 'Seedrs Private Portfolio', ticker: 'PRIVATE', value: 18_400, returnPct: 9.6, dayPct: 0, account: 'Private', goal: 'Financial Freedom', sector: 'Private Equity', region: 'UK', aiView: { tone: 'neutral', label: 'Illiquid' } },
  { name: 'Micron Technology', ticker: 'MU', value: 12_800, returnPct: 33.1, dayPct: 2.2, account: 'GIA', goal: 'Financial Freedom', sector: 'Semiconductors', region: 'US', aiView: { tone: 'warning', label: 'Overlapping' } },
  { name: 'Taiwan Semiconductor', ticker: 'TSM', value: 10_000, returnPct: 27.5, dayPct: 1.4, account: 'GIA', goal: 'Financial Freedom', sector: 'Semiconductors', region: 'Asia', aiView: { tone: 'warning', label: 'Overlapping' } },
]

export const portfolio = {
  value: 612_400,
  dayChange: 4_182,
  dayChangePct: 0.69,
}

/* ----------------------------- Hidden exposure --------------------------- */

export const hiddenExposures = [
  {
    id: 'nvidia',
    title: 'Nvidia ecosystem exposure',
    severity: 'high' as const,
    effective: 21.1,
    breakdown: [
      { label: 'Direct NVDA', value: 10.2 },
      { label: 'ETF exposure', value: 3.8 },
      { label: 'Pension exposure', value: 2.4 },
      { label: 'Indirect semiconductor', value: 4.7 },
    ],
    explanation:
      'Your direct Nvidia position represents only half of your actual exposure to the Nvidia ecosystem. Global ETFs, your pension fund and semiconductor suppliers (TSM, Micron) all move with the same demand cycle.',
  },
  {
    id: 'bp',
    title: 'Employer concentration',
    severity: 'high' as const,
    effective: 28.2,
    breakdown: [
      { label: 'BP shares (pension)', value: 28.2 },
      { label: 'Employment income', value: 100 },
    ],
    explanation:
      'BP represents 28% of your liquid portfolio and your employment income is also linked to BP. A company-specific downturn would affect both your savings and your salary at the same time.',
  },
]

/* ---------------------------------- Goals -------------------------------- */

export type GoalStatus = 'Ahead' | 'On Track' | 'Slightly Behind' | 'Behind'

export type Goal = {
  id: string
  name: string
  description: string
  current: number
  target: number
  targetDate: string
  targetYear: number
  monthly: number
  expectedReturn: number
  requiredReturn: number
  status: GoalStatus
  probability: number
  icon: 'freedom' | 'education' | 'home' | 'retirement' | 'car'
}

export const goals: Goal[] = [
  { id: 'financial-freedom', name: 'Financial Freedom', description: 'Work becomes optional. Portfolio covers £50K/yr of spending.', current: 824_000, target: 1_250_000, targetDate: 'March 2031', targetYear: 2031, monthly: 4_500, expectedReturn: 5.2, requiredReturn: 4.1, status: 'Ahead', probability: 87, icon: 'freedom' },
  { id: 'education', name: "Children's Education", description: 'University fees and living costs for two children.', current: 61_000, target: 180_000, targetDate: 'September 2038', targetYear: 2038, monthly: 450, expectedReturn: 6.0, requiredReturn: 5.4, status: 'On Track', probability: 78, icon: 'education' },
  { id: 'home', name: 'Home Purchase', description: 'Deposit and costs for a family home in Surrey.', current: 122_000, target: 250_000, targetDate: 'June 2029', targetYear: 2029, monthly: 2_900, expectedReturn: 3.8, requiredReturn: 3.2, status: 'On Track', probability: 81, icon: 'home' },
  { id: 'india-retirement', name: 'India Retirement', description: 'Retirement home and income in Bengaluru.', current: 420_000, target: 900_000, targetDate: 'April 2036', targetYear: 2036, monthly: 1_800, expectedReturn: 6.4, requiredReturn: 7.1, status: 'Slightly Behind', probability: 64, icon: 'retirement' },
  { id: 'car', name: 'Family Car', description: 'Replace the current car with an electric SUV.', current: 18_000, target: 40_000, targetDate: 'March 2028', targetYear: 2028, monthly: 1_100, expectedReturn: 3.5, requiredReturn: 2.8, status: 'On Track', probability: 84, icon: 'car' },
]

export function getGoal(id: string) {
  return goals.find((g) => g.id === id)
}

/** Monthly compounding projection with an optimistic and conservative band. */
export function projectGoal(goal: Goal, extraMonthly = 0) {
  const startYear = 2026.75
  const months = Math.max(12, Math.round((goal.targetYear + 0.25 - startYear) * 12) + 12)
  const paths = { expected: goal.expectedReturn, optimistic: goal.expectedReturn + 2.4, conservative: goal.expectedReturn - 2.6 }
  const values: Record<keyof typeof paths, number> = { expected: goal.current, optimistic: goal.current, conservative: goal.current }
  const out: { label: string; expected: number; band: [number, number]; target: number }[] = []
  for (let m = 0; m <= months; m++) {
    if (m > 0) {
      for (const k of Object.keys(paths) as (keyof typeof paths)[]) {
        values[k] = values[k] * (1 + paths[k] / 100 / 12) + goal.monthly + extraMonthly
      }
    }
    if (m % 3 === 0) {
      const year = Math.floor(startYear + m / 12)
      const q = Math.floor(((startYear + m / 12) % 1) * 4) + 1
      out.push({
        label: `Q${q} ${year}`,
        expected: Math.round(values.expected),
        band: [Math.round(values.conservative), Math.round(values.optimistic)],
        target: goal.target,
      })
    }
  }
  return out
}

/* --------------------------------- Accounts ------------------------------ */

export const accounts = [
  { name: 'Trading 212', type: 'Stocks & Shares ISA · GIA', value: 143_500, status: 'Connected' as const, refreshed: '4 min ago', region: 'UK' },
  { name: 'Hargreaves Lansdown', type: 'Stocks & Shares ISA', value: 94_900, status: 'Connected' as const, refreshed: '12 min ago', region: 'UK' },
  { name: 'Interactive Brokers', type: 'US brokerage', value: 83_200, status: 'Connected' as const, refreshed: '4 min ago', region: 'US' },
  { name: 'BP Pension', type: 'Workplace pension', value: 201_400, status: 'Connected' as const, refreshed: '1 hr ago', region: 'UK' },
  { name: 'India Mutual Funds', type: 'CAMS · Zerodha Coin', value: 71_200, status: 'Connected' as const, refreshed: '3 hr ago', region: 'India' },
  { name: 'BullionVault', type: 'Physical gold', value: 18_200, status: 'Connected' as const, refreshed: '20 min ago', region: 'Global' },
  { name: 'Property', type: 'Buy-to-let, Reading', value: 265_000, status: 'Manual' as const, refreshed: 'Updated 14 Aug', region: 'UK' },
  { name: 'Cash Accounts', type: 'Monzo · Chase · HDFC', value: 41_950, status: 'Connected' as const, refreshed: '2 min ago', region: 'Multi' },
  { name: 'Nationwide Mortgage', type: 'Liability · 4.29% fixed to 2028', value: -95_000, status: 'Connected' as const, refreshed: '1 day ago', region: 'UK' },
]

/* --------------------------------- Insights ------------------------------ */

export const insights = [
  { id: 'i1', kind: 'warning' as const, category: 'Concentration', title: 'Concentration increased', body: 'Technology now represents 41% of your portfolio, up from 35% three months ago.', time: '2 hours ago' },
  { id: 'i2', kind: 'positive' as const, category: 'Goals', title: 'Goal ahead of plan', body: 'Your Financial Freedom target moved 7 months earlier because of portfolio growth.', time: 'Yesterday' },
  { id: 'i3', kind: 'warning' as const, category: 'Currency', title: 'Currency risk increased', body: 'USD exposure reached 51%, while most future spending is expected in GBP and INR.', time: '2 days ago' },
  { id: 'i4', kind: 'ai' as const, category: 'Tax', title: 'Tax opportunity', body: 'You still have £8,500 of unused ISA allowance before 5 April 2027.', time: '3 days ago' },
  { id: 'i5', kind: 'neutral' as const, category: 'Behaviour', title: 'Portfolio behaviour', body: 'You bought technology stocks during four of the last five market declines.', time: 'Last week' },
]

/* ------------------------------- Opportunities --------------------------- */

export const opportunities = [
  {
    id: 'global-small-cap',
    name: 'Global Small Cap ETF',
    ticker: 'WLDS',
    fit: 'High' as const,
    diversification: 'Strong',
    goal: 'Financial Freedom',
    overlap: 'Low',
    risk: 'Medium',
    explanation: 'This adds exposure currently missing from your portfolio and reduces your dependence on large-cap technology.',
  },
  {
    id: 'gilts',
    name: 'Short-dated UK Gilts',
    ticker: 'IGLS',
    fit: 'Medium' as const,
    diversification: 'Moderate',
    goal: 'Home Purchase',
    overlap: 'Low',
    risk: 'Low',
    explanation: 'Your home purchase is under three years away. GBP-denominated, low-volatility assets better match the currency and timing of that liability.',
  },
  {
    id: 'india-equity',
    name: 'India Equity Fund',
    ticker: 'IN-FLEXI',
    fit: 'Low' as const,
    diversification: 'Weak',
    goal: 'India Retirement',
    overlap: 'High',
    risk: 'Medium-High',
    explanation: 'You already have significant India exposure through mutual funds and property. Adding more would increase geographic concentration.',
  },
]
