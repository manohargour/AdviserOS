import { holdings, portfolio } from './data'

export type Impact = { label: string; before: number; perTenK: number; unit: '%' | 'level'; better: 'lower' | 'higher' }

export type Analysis = {
  id: string
  name: string
  ticker: string
  kind: 'Stock' | 'ETF' | 'Fund'
  summary: string
  price: string
  metrics: { label: string; value: string; note: string; tone: 'positive' | 'neutral' | 'warning' | 'negative' }[]
  fit: { verdict: 'High' | 'Medium' | 'Low'; existing: string; goal: string; notes: string[] }
  impacts: Impact[]
  concentration: [string, string, string]
  defaultAmount: number
}

const levels = ['Low', 'Moderate', 'High', 'Very high']

export const analyses: Record<string, Analysis> = {
  nvda: {
    id: 'nvda',
    name: 'Nvidia',
    ticker: 'NVDA',
    kind: 'Stock',
    summary: 'Designs GPUs and networking systems that power most AI training and inference workloads. Data centre is ~88% of revenue.',
    price: '$184.20',
    metrics: [
      { label: 'Valuation', value: '34× fwd P/E', note: '5-yr avg 41× · sector 26×', tone: 'warning' },
      { label: 'Revenue growth', value: '+56% YoY', note: 'Decelerating from +114%', tone: 'positive' },
      { label: 'Margins', value: '72% gross', note: 'Operating margin 61%', tone: 'positive' },
      { label: 'Balance sheet', value: 'Net cash $52B', note: 'Minimal debt', tone: 'positive' },
      { label: 'Risk', value: 'High', note: 'Beta 1.9 · export controls', tone: 'negative' },
      { label: 'Analyst expectations', value: '$212 median', note: '48 buy · 6 hold · 1 sell', tone: 'neutral' },
    ],
    fit: {
      verdict: 'Low',
      existing: '21.1% effective (10.2% direct)',
      goal: 'Financial Freedom',
      notes: [
        'You already own Nvidia directly, through three ETFs and via your L&G pension fund.',
        'Semiconductor holdings (TSM, MU) move with the same AI capex cycle.',
        'Adding more increases return potential but concentrates your Freedom goal on a single demand driver.',
      ],
    },
    impacts: [
      { label: 'Technology exposure', before: 41, perTenK: 1.5, unit: '%', better: 'lower' },
      { label: 'US exposure', before: 52, perTenK: 1.0, unit: '%', better: 'lower' },
      { label: 'Portfolio volatility', before: 14.8, perTenK: 0.23, unit: '%', better: 'lower' },
      { label: 'Financial Freedom probability', before: 87, perTenK: 0.5, unit: '%', better: 'higher' },
    ],
    concentration: ['Moderate', 'High', 'Very high'],
    defaultAmount: 20_000,
  },
  wlds: {
    id: 'wlds',
    name: 'SPDR MSCI World Small Cap ETF',
    ticker: 'WLDS',
    kind: 'ETF',
    summary: 'Tracks ~3,900 small companies across 23 developed markets. Tech weight 12% versus 26% in global large-cap indices.',
    price: '£96.40',
    metrics: [
      { label: 'Valuation', value: '15× fwd P/E', note: 'vs 19× MSCI World', tone: 'positive' },
      { label: 'Revenue growth', value: '+6% YoY', note: 'Index constituents, median', tone: 'neutral' },
      { label: 'Margins', value: '9% net', note: 'Lower than large caps', tone: 'neutral' },
      { label: 'Cost', value: '0.45% OCF', note: 'Physical replication', tone: 'neutral' },
      { label: 'Risk', value: 'Medium', note: 'Volatility 17% · beta 1.05', tone: 'warning' },
      { label: 'Correlation to your tech', value: '0.58', note: 'Lower than any current holding', tone: 'positive' },
    ],
    fit: {
      verdict: 'High',
      existing: '0.9% (via global all-cap)',
      goal: 'Financial Freedom',
      notes: [
        'Adds exposure to ~3,000 companies you do not currently own.',
        'Reduces reliance on the ten largest US technology companies.',
        'Eligible for your remaining £8,500 ISA allowance.',
      ],
    },
    impacts: [
      { label: 'Technology exposure', before: 41, perTenK: -0.5, unit: '%', better: 'lower' },
      { label: 'US exposure', before: 52, perTenK: -0.2, unit: '%', better: 'lower' },
      { label: 'Portfolio volatility', before: 14.8, perTenK: -0.08, unit: '%', better: 'lower' },
      { label: 'Financial Freedom probability', before: 87, perTenK: 0.4, unit: '%', better: 'higher' },
    ],
    concentration: ['Moderate', 'Moderate', 'Moderate'],
    defaultAmount: 8_500,
  },
  igls: {
    id: 'igls',
    name: 'iShares UK Gilts 0-5yr',
    ticker: 'IGLS',
    kind: 'ETF',
    summary: 'Short-dated UK government bonds. Low volatility, GBP-denominated, yield-to-maturity 4.1%.',
    price: '£130.85',
    metrics: [
      { label: 'Yield', value: '4.1% YTM', note: 'Duration 2.1 years', tone: 'positive' },
      { label: 'Credit quality', value: 'AA', note: 'UK government', tone: 'positive' },
      { label: 'Cost', value: '0.07% OCF', note: '', tone: 'positive' },
      { label: 'Currency', value: 'GBP', note: 'Matches home purchase', tone: 'positive' },
      { label: 'Risk', value: 'Low', note: 'Volatility 2.4%', tone: 'positive' },
      { label: 'Inflation sensitivity', value: 'Moderate', note: 'Nominal, not linked', tone: 'neutral' },
    ],
    fit: {
      verdict: 'Medium',
      existing: '4.0% bonds (global aggregate)',
      goal: 'Home Purchase',
      notes: [
        'Your home deposit is needed in under three years; equity volatility is a timing risk.',
        'GBP-denominated — removes currency mismatch for a GBP liability.',
        'Gilts are CGT-exempt when held outside an ISA.',
      ],
    },
    impacts: [
      { label: 'Technology exposure', before: 41, perTenK: -0.6, unit: '%', better: 'lower' },
      { label: 'US exposure', before: 52, perTenK: -0.8, unit: '%', better: 'lower' },
      { label: 'Portfolio volatility', before: 14.8, perTenK: -0.21, unit: '%', better: 'lower' },
      { label: 'Home Purchase probability', before: 81, perTenK: 2.2, unit: '%', better: 'higher' },
    ],
    concentration: ['Moderate', 'Moderate', 'Low'],
    defaultAmount: 30_000,
  },
  'in-flexi': {
    id: 'in-flexi',
    name: 'Parag Parikh Flexi Cap Fund',
    ticker: 'IN-FLEXI',
    kind: 'Fund',
    summary: 'Indian flexi-cap mutual fund with up to 35% in overseas equities. Direct plan, growth option.',
    price: '₹84.12 NAV',
    metrics: [
      { label: 'Valuation', value: '24× P/E', note: 'Nifty 50 at 22×', tone: 'warning' },
      { label: '5-yr CAGR', value: '+21.4%', note: 'INR terms', tone: 'positive' },
      { label: 'Cost', value: '0.63% TER', note: 'Direct plan', tone: 'neutral' },
      { label: 'Currency', value: 'INR', note: 'Matches India Retirement', tone: 'positive' },
      { label: 'Risk', value: 'Medium-High', note: 'Volatility 15%', tone: 'warning' },
      { label: 'UK tax', value: 'Non-reporting', note: 'Gains taxed as income', tone: 'negative' },
    ],
    fit: {
      verdict: 'Low',
      existing: '17% India (MF + property)',
      goal: 'India Retirement',
      notes: [
        'You already have significant India exposure through mutual funds and property.',
        'Non-reporting fund status means gains are taxed at your income rate in the UK.',
        'Currency-matched to your India Retirement liability, which partly offsets the concentration.',
      ],
    },
    impacts: [
      { label: 'India exposure', before: 17, perTenK: 1.4, unit: '%', better: 'lower' },
      { label: 'INR currency', before: 16, perTenK: 1.4, unit: '%', better: 'lower' },
      { label: 'Portfolio volatility', before: 14.8, perTenK: 0.02, unit: '%', better: 'lower' },
      { label: 'India Retirement probability', before: 64, perTenK: 1.6, unit: '%', better: 'higher' },
    ],
    concentration: ['Moderate', 'Moderate', 'High'],
    defaultAmount: 15_000,
  },
}

export function getAnalysis(id: string): Analysis | undefined {
  if (analyses[id]) return analyses[id]
  const h = holdings.find((x) => x.ticker.toLowerCase().replace('.', '') === id)
  if (!h) return undefined
  const weight = (h.value / portfolio.value) * 100
  const isTech = ['Semiconductors', 'Software', 'AI Infrastructure'].includes(h.sector)
  const conc = weight > 15 ? 3 : weight > 7 ? 2 : 1
  return {
    id,
    name: h.name,
    ticker: h.ticker,
    kind: h.sector === 'Diversified' || h.sector === 'Bonds' ? 'ETF' : 'Stock',
    summary: `${h.name} is held in your ${h.account} account and assigned to ${h.goal}. Sector: ${h.sector}, region: ${h.region}.`,
    price: '—',
    metrics: [
      { label: 'Your position', value: `£${h.value.toLocaleString('en-GB')}`, note: `${weight.toFixed(1)}% of portfolio`, tone: weight > 10 ? 'warning' : 'neutral' },
      { label: 'Your return', value: `${h.returnPct > 0 ? '+' : ''}${h.returnPct}%`, note: 'Since first purchase', tone: h.returnPct > 0 ? 'positive' : 'negative' },
      { label: 'Sector', value: h.sector, note: h.region, tone: 'neutral' },
      { label: 'Account', value: h.account, note: 'Tax wrapper', tone: 'neutral' },
      { label: 'Risk', value: isTech ? 'High' : 'Medium', note: isTech ? 'Correlated with AI capex cycle' : 'Broad exposure', tone: isTech ? 'warning' : 'neutral' },
      { label: 'AI view', value: h.aiView.label, note: 'Based on whole-portfolio fit', tone: h.aiView.tone },
    ],
    fit: {
      verdict: conc === 3 || isTech ? 'Low' : 'Medium',
      existing: `${weight.toFixed(1)}% direct`,
      goal: h.goal,
      notes: [`Already ${weight.toFixed(1)}% of investable assets.`, isTech ? 'Overlaps with your Nvidia ecosystem exposure.' : 'Limited overlap with your largest exposures.'],
    },
    impacts: [
      { label: 'Technology exposure', before: 41, perTenK: isTech ? 1.5 : -0.3, unit: '%', better: 'lower' },
      { label: `${h.region} exposure`, before: h.region === 'US' ? 52 : h.region === 'UK' ? 18 : 10, perTenK: 1.0, unit: '%', better: 'lower' },
      { label: 'Portfolio volatility', before: 14.8, perTenK: isTech ? 0.2 : 0.02, unit: '%', better: 'lower' },
      { label: `${h.goal} probability`, before: 87, perTenK: 0.3, unit: '%', better: 'higher' },
    ],
    concentration: [levels[conc], levels[Math.min(3, conc + 1)], levels[Math.min(3, conc + 1)]],
    defaultAmount: 10_000,
  }
}
