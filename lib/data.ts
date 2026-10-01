export type AssetClass = 'Equity' | 'Bonds' | 'Property' | 'Cash' | 'Alternatives'

export type Holding = {
  name: string
  assetClass: AssetClass
  value: number
  platform: string
}

export type Change = {
  id: string
  title: string
  from?: string
  to?: string
  delta?: string
  detail: string
  source: string
}

export type OutstandingItem = {
  id: string
  title: string
  detail: string
  kind: 'adviser' | 'client'
}

export type Goal = {
  title: string
  target: string
  horizon: string
  progress: number
}

export type ClientStatus =
  | 'Annual Review Due'
  | 'Meeting Today'
  | 'Risk Profile Updated'
  | 'Action Required'
  | 'Up to Date'

export type Client = {
  id: string
  name: string
  firstName: string
  initials: string
  age: number
  occupation: string
  status: ClientStatus
  portfolioValue: number
  previousValue: number
  previousEquityPct: number
  risk: { label: string; score: number; previousScore: number; assessedOn: string; tool: string }
  lastReview: string
  nextReview: string
  meeting?: { time: string; inMinutes?: number; purpose: string }
  reviewReadiness: number
  holdings: Holding[]
  goals: Goal[]
  changes: Change[]
  outstanding: OutstandingItem[]
  missing: string[]
  notes: { date: string; author: string; text: string }[]
  discussion: string[]
  documents: { name: string; type: string; date: string; source: string }[]
  activity: { date: string; text: string }[]
}

export const ADVISER = { name: 'Charlotte Hayes', firstName: 'Charlotte', firm: 'Hayes & Partners Wealth' }
export const TODAY_LABEL = 'Thursday, 1 October 2026'

function holdingsFor(total: number, equityPct: number, platform: string): Holding[] {
  const equity = Math.round((total * equityPct) / 100)
  const cash = Math.round(total * 0.05)
  const property = Math.round(total * 0.06)
  const bonds = total - equity - cash - property
  return [
    { name: 'Vanguard FTSE Global All Cap', assetClass: 'Equity', value: Math.round(equity * 0.6), platform },
    { name: 'HSBC FTSE All-Share Index', assetClass: 'Equity', value: equity - Math.round(equity * 0.6), platform },
    { name: 'Royal London Short Duration Gilts', assetClass: 'Bonds', value: bonds, platform },
    { name: 'iShares UK Property', assetClass: 'Property', value: property, platform },
    { name: 'Cash account', assetClass: 'Cash', value: cash, platform },
  ]
}

export const clients: Client[] = [
  {
    id: 'john-smith',
    name: 'John Smith',
    firstName: 'John',
    initials: 'JS',
    age: 63,
    occupation: 'Retired engineer',
    status: 'Annual Review Due',
    portfolioValue: 438500,
    previousValue: 412000,
    previousEquityPct: 62,
    risk: { label: 'Moderate', score: 5, previousScore: 5, assessedOn: '14 Sep 2026', tool: 'Dynamic Planner' },
    lastReview: '12 Oct 2025',
    nextReview: '12 Oct 2026',
    reviewReadiness: 92,
    holdings: [
      { name: 'Vanguard FTSE Global All Cap', assetClass: 'Equity', value: 148200, platform: 'Transact' },
      { name: 'Fidelity Index World', assetClass: 'Equity', value: 90000, platform: 'Transact' },
      { name: 'L&G UK Index Trust', assetClass: 'Equity', value: 64365, platform: 'Transact' },
      { name: 'Royal London Short Duration Gilts', assetClass: 'Bonds', value: 68000, platform: 'Transact' },
      { name: 'iShares Corporate Bond Index', assetClass: 'Bonds', value: 41935, platform: 'Transact' },
      { name: 'Cash account', assetClass: 'Cash', value: 26000, platform: 'Transact' },
    ],
    goals: [
      { title: 'Sustainable retirement income', target: '£28,000 a year', horizon: 'Ongoing', progress: 84 },
      { title: 'Help grandchildren with university', target: '£40,000', horizon: '2031', progress: 46 },
      { title: 'Maintain emergency fund', target: '£25,000', horizon: 'Ongoing', progress: 100 },
    ],
    changes: [
      {
        id: 'value',
        title: 'Portfolio value',
        from: '£412,000',
        to: '£438,500',
        delta: '+£26,500',
        detail: 'Growth driven mainly by global equity funds.',
        source: 'Transact portfolio export · Sep 2026',
      },
      {
        id: 'equity',
        title: 'Equity allocation',
        from: '62%',
        to: '69%',
        delta: '+7 pts',
        detail: 'Market drift. No rebalancing since the last review.',
        source: 'Transact portfolio export · Sep 2026',
      },
      {
        id: 'pension',
        title: 'Pension',
        detail: 'Income withdrawals of £1,850 a month detected from March 2026.',
        source: 'Aviva SIPP statement · Aug 2026',
      },
      {
        id: 'circumstances',
        title: 'Client circumstances',
        detail: 'No material changes found in available fact-find information.',
        source: 'Xplan fact-find · updated Jul 2026',
      },
    ],
    outstanding: [
      {
        id: 'js-equity',
        title: 'Confirm equity drift remains suitable',
        detail: 'Allocation is 69% against a Moderate 5/10 model range of 55–65%.',
        kind: 'adviser',
      },
      {
        id: 'js-withdrawals',
        title: 'Review sustainability of pension withdrawals',
        detail: '£22,200 a year equals a 5.1% withdrawal rate on the SIPP.',
        kind: 'adviser',
      },
      {
        id: 'js-health',
        title: 'Confirm health and circumstances with client',
        detail: 'Fact-find last confirmed by John in July 2026.',
        kind: 'client',
      },
    ],
    missing: [
      'Updated State Pension forecast (last on file: 2023)',
      'Confirmation of expected inheritance mentioned in 2025 meeting notes',
    ],
    notes: [
      {
        date: '12 Oct 2025',
        author: 'Charlotte Hayes',
        text: 'John comfortable with current risk level. Wants to start drawing pension income in spring. Mentioned helping grandchildren with university costs.',
      },
      {
        date: '3 Mar 2026',
        author: 'Charlotte Hayes',
        text: 'Pension drawdown set up at £1,850 a month. Reviewed tax position with John.',
      },
    ],
    discussion: [
      'Whether to rebalance equity back within the Moderate range',
      'Sustainability of current pension withdrawals',
      'Education funding plan for grandchildren',
    ],
    documents: [
      { name: 'Portfolio Export — September 2026', type: 'Valuation', date: '30 Sep 2026', source: 'Transact' },
      { name: 'Risk Profile Questionnaire', type: 'Risk assessment', date: '14 Sep 2026', source: 'Dynamic Planner' },
      { name: 'SIPP Statement — August 2026', type: 'Statement', date: '31 Aug 2026', source: 'Aviva' },
      { name: 'Fact-find', type: 'Client data', date: '18 Jul 2026', source: 'Xplan' },
      { name: 'Annual Review Letter 2025', type: 'Review letter', date: '20 Oct 2025', source: 'Xplan' },
    ],
    activity: [
      { date: 'Today, 08:12', text: 'Adviser Copilot detected 4 changes since the last review' },
      { date: '30 Sep 2026', text: 'Portfolio export received from Transact' },
      { date: '14 Sep 2026', text: 'Risk questionnaire completed — Moderate 5/10' },
      { date: '3 Mar 2026', text: 'Pension drawdown started' },
      { date: '20 Oct 2025', text: 'Annual review letter sent' },
    ],
  },
  {
    id: 'sarah-williams',
    name: 'Sarah Williams',
    firstName: 'Sarah',
    initials: 'SW',
    age: 52,
    occupation: 'Partner, law firm',
    status: 'Meeting Today',
    portfolioValue: 1240000,
    previousValue: 1185000,
    previousEquityPct: 70,
    risk: { label: 'Balanced', score: 6, previousScore: 6, assessedOn: '2 Feb 2026', tool: 'Dynamic Planner' },
    lastReview: '2 Feb 2026',
    nextReview: '2 Feb 2027',
    meeting: { time: '09:25', inMinutes: 25, purpose: 'Mid-year check-in' },
    reviewReadiness: 0,
    holdings: holdingsFor(1240000, 72, 'Fidelity'),
    goals: [
      { title: 'Retire at 60', target: '£75,000 a year', horizon: '2034', progress: 61 },
      { title: 'Pay off mortgage', target: '£180,000', horizon: '2029', progress: 72 },
    ],
    changes: [
      { id: 'value', title: 'Portfolio value', from: '£1,185,000', to: '£1,240,000', delta: '+£55,000', detail: 'Includes £20,000 ISA subscription in April.', source: 'Fidelity valuation · Sep 2026' },
      { id: 'contrib', title: 'Pension contributions', detail: 'Employer contributions increased to 10% from June.', source: 'Payroll letter · Jun 2026' },
    ],
    outstanding: [
      { id: 'sw-isa', title: 'Confirm 2026/27 ISA subscription', detail: '£0 of £20,000 allowance used so far this tax year.', kind: 'client' },
    ],
    missing: ['Latest mortgage statement'],
    notes: [
      { date: '2 Feb 2026', author: 'Charlotte Hayes', text: 'Sarah considering reducing to four days a week from 2027. Wants to understand impact on retirement date.' },
    ],
    discussion: [
      'Impact of a four-day week on retiring at 60',
      'Using this year’s ISA allowance',
      'Mortgage overpayment versus pension contributions',
    ],
    documents: [
      { name: 'Valuation — September 2026', type: 'Valuation', date: '30 Sep 2026', source: 'Fidelity' },
      { name: 'Annual Review Letter 2026', type: 'Review letter', date: '10 Feb 2026', source: 'Xplan' },
    ],
    activity: [
      { date: 'Today, 09:25', text: 'Mid-year check-in scheduled' },
      { date: '10 Feb 2026', text: 'Annual review letter sent' },
    ],
  },
  {
    id: 'emma-thompson',
    name: 'Emma Thompson',
    firstName: 'Emma',
    initials: 'ET',
    age: 45,
    occupation: 'Company director',
    status: 'Meeting Today',
    portfolioValue: 685200,
    previousValue: 640000,
    previousEquityPct: 75,
    risk: { label: 'Adventurous', score: 7, previousScore: 7, assessedOn: '11 Nov 2025', tool: 'FinaMetrica' },
    lastReview: '11 Nov 2025',
    nextReview: '11 Nov 2026',
    meeting: { time: '14:00', purpose: 'Business sale planning' },
    reviewReadiness: 40,
    holdings: holdingsFor(685200, 76, 'abrdn Wrap'),
    goals: [
      { title: 'Plan for business sale proceeds', target: '£1.5m', horizon: '2027', progress: 20 },
      { title: 'School fees', target: '£30,000 a year', horizon: '2026–2035', progress: 55 },
    ],
    changes: [
      { id: 'value', title: 'Portfolio value', from: '£640,000', to: '£685,200', delta: '+£45,200', detail: 'Market growth.', source: 'abrdn Wrap valuation · Sep 2026' },
    ],
    outstanding: [
      { id: 'et-tax', title: 'Obtain accountant’s view on BADR eligibility', detail: 'Requested 18 Sep, no response yet.', kind: 'adviser' },
      { id: 'et-will', title: 'Confirm updated will has been signed', detail: 'Solicitor draft issued in August.', kind: 'client' },
    ],
    missing: ['Business valuation report'],
    notes: [
      { date: '11 Nov 2025', author: 'Charlotte Hayes', text: 'Emma exploring sale of her company within 18 months. Asked about Business Asset Disposal Relief.' },
    ],
    discussion: ['Timeline for business sale', 'Investing sale proceeds', 'School fee planning'],
    documents: [{ name: 'Valuation — September 2026', type: 'Valuation', date: '30 Sep 2026', source: 'abrdn Wrap' }],
    activity: [{ date: 'Today, 14:00', text: 'Client meeting scheduled' }],
  },
  {
    id: 'david-patel',
    name: 'David Patel',
    firstName: 'David',
    initials: 'DP',
    age: 58,
    occupation: 'GP',
    status: 'Risk Profile Updated',
    portfolioValue: 512750,
    previousValue: 498000,
    previousEquityPct: 68,
    risk: { label: 'Cautious-Moderate', score: 4, previousScore: 6, assessedOn: '28 Sep 2026', tool: 'Dynamic Planner' },
    lastReview: '5 Mar 2026',
    nextReview: '5 Mar 2027',
    reviewReadiness: 0,
    holdings: holdingsFor(512750, 68, 'Transact'),
    goals: [{ title: 'Retire at 62', target: '£45,000 a year', horizon: '2030', progress: 70 }],
    changes: [
      { id: 'risk', title: 'Risk score', from: '6/10', to: '4/10', delta: '−2', detail: 'New questionnaire completed after a period of market volatility.', source: 'Dynamic Planner · 28 Sep 2026' },
    ],
    outstanding: [
      { id: 'dp-portfolio', title: 'Assess portfolio against new risk profile', detail: '68% equity against a 4/10 model range of 35–45%.', kind: 'adviser' },
    ],
    missing: [],
    notes: [],
    discussion: ['Reasons behind lower risk tolerance', 'Whether to de-risk the portfolio'],
    documents: [{ name: 'Risk Profile Questionnaire', type: 'Risk assessment', date: '28 Sep 2026', source: 'Dynamic Planner' }],
    activity: [{ date: '28 Sep 2026', text: 'Risk questionnaire completed — 4/10' }],
  },
  {
    id: 'michael-chen',
    name: 'Michael Chen',
    firstName: 'Michael',
    initials: 'MC',
    age: 67,
    occupation: 'Retired',
    status: 'Annual Review Due',
    portfolioValue: 892300,
    previousValue: 871000,
    previousEquityPct: 55,
    risk: { label: 'Moderate', score: 5, previousScore: 5, assessedOn: '9 Oct 2025', tool: 'Dynamic Planner' },
    lastReview: '9 Oct 2025',
    nextReview: '9 Oct 2026',
    reviewReadiness: 64,
    holdings: holdingsFor(892300, 56, 'Quilter'),
    goals: [{ title: 'Inheritance tax planning', target: 'Reduce IHT liability', horizon: 'Ongoing', progress: 35 }],
    changes: [{ id: 'value', title: 'Portfolio value', from: '£871,000', to: '£892,300', delta: '+£21,300', detail: 'Market growth.', source: 'Quilter valuation · Sep 2026' }],
    outstanding: [{ id: 'mc-risk', title: 'Risk questionnaire overdue', detail: 'Last completed October 2025.', kind: 'client' }],
    missing: ['Updated risk questionnaire'],
    notes: [],
    discussion: ['Gifting strategy', 'Updating risk profile'],
    documents: [],
    activity: [],
  },
  {
    id: 'olivia-brown',
    name: 'Olivia Brown',
    firstName: 'Olivia',
    initials: 'OB',
    age: 39,
    occupation: 'Architect',
    status: 'Action Required',
    portfolioValue: 214600,
    previousValue: 190400,
    previousEquityPct: 80,
    risk: { label: 'Adventurous', score: 7, previousScore: 7, assessedOn: '22 Apr 2026', tool: 'FinaMetrica' },
    lastReview: '22 Apr 2026',
    nextReview: '22 Apr 2027',
    reviewReadiness: 0,
    holdings: holdingsFor(214600, 81, 'Fidelity'),
    goals: [{ title: 'Buy a larger home', target: '£120,000 deposit', horizon: '2028', progress: 48 }],
    changes: [],
    outstanding: [{ id: 'ob-id', title: 'ID documents expired', detail: 'Passport expired August 2026.', kind: 'client' }],
    missing: ['Valid identity document'],
    notes: [],
    discussion: [],
    documents: [],
    activity: [],
  },
  {
    id: 'james-wilson',
    name: 'James Wilson',
    firstName: 'James',
    initials: 'JW',
    age: 71,
    occupation: 'Retired',
    status: 'Up to Date',
    portfolioValue: 1630000,
    previousValue: 1598000,
    previousEquityPct: 48,
    risk: { label: 'Cautious-Moderate', score: 4, previousScore: 4, assessedOn: '1 Jun 2026', tool: 'Dynamic Planner' },
    lastReview: '1 Jun 2026',
    nextReview: '1 Jun 2027',
    reviewReadiness: 0,
    holdings: holdingsFor(1630000, 48, 'Transact'),
    goals: [{ title: 'Income for life', target: '£60,000 a year', horizon: 'Ongoing', progress: 92 }],
    changes: [],
    outstanding: [],
    missing: [],
    notes: [],
    discussion: [],
    documents: [],
    activity: [],
  },
]

export function getClient(id: string) {
  return clients.find((client) => client.id === id)
}

export function findClientInText(text: string) {
  const lower = text.toLowerCase()
  return clients.find(
    (client) => lower.includes(client.name.toLowerCase()) || lower.includes(client.firstName.toLowerCase()),
  )
}

export function equityValue(client: Client) {
  return client.holdings.filter((h) => h.assetClass === 'Equity').reduce((sum, h) => sum + h.value, 0)
}

export function equityPct(client: Client) {
  return (equityValue(client) / client.portfolioValue) * 100
}

export function allocation(client: Client) {
  const classes: AssetClass[] = ['Equity', 'Bonds', 'Property', 'Alternatives', 'Cash']
  return classes
    .map((assetClass) => {
      const value = client.holdings.filter((h) => h.assetClass === assetClass).reduce((s, h) => s + h.value, 0)
      return { assetClass, value, pct: (value / client.portfolioValue) * 100 }
    })
    .filter((row) => row.value > 0)
}

export const gbp = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)

export const reviewsDue = [
  { clientId: 'john-smith', name: 'John Smith', due: '12 Oct 2026', readiness: 92, status: 'Draft ready' },
  { clientId: 'michael-chen', name: 'Michael Chen', due: '9 Oct 2026', readiness: 64, status: 'In progress' },
  { clientId: 'emma-thompson', name: 'Emma Thompson', due: '11 Nov 2026', readiness: 40, status: 'In progress' },
  { name: 'Rachel Green', due: '6 Oct 2026', readiness: 88, status: 'Draft ready' },
  { name: 'Thomas Wright', due: '8 Oct 2026', readiness: 85, status: 'Draft ready' },
  { name: 'Hannah Lewis', due: '9 Oct 2026', readiness: 90, status: 'Draft ready' },
  { name: 'George Hall', due: '14 Oct 2026', readiness: 72, status: 'In progress' },
  { name: 'Sophie Clarke', due: '15 Oct 2026', readiness: 81, status: 'Draft ready' },
  { name: 'Daniel Young', due: '19 Oct 2026', readiness: 30, status: 'Awaiting data' },
  { name: 'Lucy Turner', due: '21 Oct 2026', readiness: 86, status: 'Draft ready' },
  { name: 'Robert King', due: '23 Oct 2026', readiness: 0, status: 'Not started' },
  { name: 'Amelia Scott', due: '27 Oct 2026', readiness: 78, status: 'Draft ready' },
  { name: 'William Baker', due: '29 Oct 2026', readiness: 0, status: 'Not started' },
  { name: 'Grace Adams', due: '30 Oct 2026', readiness: 83, status: 'Draft ready' },
  { name: 'Henry Morris', due: '31 Oct 2026', readiness: 55, status: 'Awaiting data' },
] as { clientId?: string; name: string; due: string; readiness: number; status: string }[]

export const tasks = [
  { id: 't1', title: 'Approve John Smith annual review', client: 'John Smith', due: 'Today', source: 'Copilot draft', done: false },
  { id: 't2', title: 'Chase accountant re: BADR eligibility', client: 'Emma Thompson', due: 'Today', source: 'Meeting notes', done: false },
  { id: 't3', title: 'Assess portfolio against new risk profile', client: 'David Patel', due: 'Tomorrow', source: 'Risk alert', done: false },
  { id: 't4', title: 'Request updated passport', client: 'Olivia Brown', due: '5 Oct', source: 'Compliance', done: false },
  { id: 't5', title: 'Send risk questionnaire', client: 'Michael Chen', due: '6 Oct', source: 'Review prep', done: false },
  { id: 't6', title: 'File signed suitability report', client: 'James Wilson', due: 'Done', source: 'Xplan', done: true },
]

export const alerts = [
  { id: 'a1', title: 'Risk profile lowered from 6/10 to 4/10', client: 'David Patel', clientId: 'david-patel', severity: 'high', time: '2 days ago' },
  { id: 'a2', title: 'Equity allocation 4 pts above model range', client: 'John Smith', clientId: 'john-smith', severity: 'medium', time: 'Today' },
  { id: 'a3', title: 'Identity document expired', client: 'Olivia Brown', clientId: 'olivia-brown', severity: 'medium', time: '1 week ago' },
  { id: 'a4', title: 'Pension withdrawal rate above 5%', client: 'John Smith', clientId: 'john-smith', severity: 'medium', time: 'Today' },
  { id: 'a5', title: 'Risk questionnaire older than 12 months', client: 'Michael Chen', clientId: 'michael-chen', severity: 'low', time: 'Today' },
  { id: 'a6', title: 'Fund manager change: L&G UK Index Trust', client: '3 clients', severity: 'low', time: '3 days ago' },
] as { id: string; title: string; client: string; clientId?: string; severity: 'high' | 'medium' | 'low'; time: string }[]

export const dataSources = [
  { name: 'Xplan', category: 'Client records', status: 'Connected', synced: '6 min ago', records: '412 clients' },
  { name: 'Transact', category: 'Investment platform', status: 'Connected', synced: '1 hr ago', records: '188 portfolios' },
  { name: 'Fidelity Adviser Solutions', category: 'Investment platform', status: 'Connected', synced: '1 hr ago', records: '96 portfolios' },
  { name: 'abrdn Wrap', category: 'Investment platform', status: 'Connected', synced: '3 hrs ago', records: '54 portfolios' },
  { name: 'Dynamic Planner', category: 'Risk profiling', status: 'Connected', synced: '20 min ago', records: '301 profiles' },
  { name: 'FE fundinfo', category: 'Fund information', status: 'Connected', synced: 'Daily', records: '24,800 funds' },
  { name: 'SharePoint', category: 'Client documents', status: 'Connected', synced: '12 min ago', records: '9,214 files' },
  { name: 'Meeting notes', category: 'Notes & transcripts', status: 'Connected', synced: 'Live', records: '1,032 notes' },
]
