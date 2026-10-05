export type AdvisorAnswer = {
  summary: string
  facts: string[]
  assumptions: string[]
  analysis: string[]
  actions: string[]
  confidence: 'High' | 'Moderate' | 'Low'
}

export const suggestedQuestions = [
  'Can I retire at 45?',
  'Should I buy a £600k house or continue renting?',
  'What happens if US technology falls 30%?',
  'Where am I overexposed?',
  "Can I fund my children's education without changing my retirement target?",
  'Should I move more money into my ISA?',
  'Analyse my portfolio against my goals.',
]

const answers: { match: RegExp; answer: AdvisorAnswer }[] = [
  {
    match: /retire|45/i,
    answer: {
      summary: 'Retiring at 45 (in 7 years) looks achievable, but with less margin than your current Financial Freedom plan.',
      facts: [
        'Net worth is £824,350; investable assets are £612,400.',
        'You contribute £4,500/month across ISA, pension and GIA.',
        'Your Financial Freedom target is £1.25M, currently 66% funded.',
      ],
      assumptions: [
        '5.2% real annual return (net of fees) on the investment portfolio.',
        'Annual spending of £50K in today’s money, 4% sustainable withdrawal rate.',
        'Pension access from 57 — the gap years are funded from ISA and GIA.',
      ],
      analysis: [
        'Your expected path reaches £1.25M around March 2031, age 43 — about 2 years before 45.',
        'However, £201K sits in pensions you cannot access until 57. Bridging 12 years requires roughly £600K outside pensions; you currently hold ~£411K.',
        'In the conservative scenario (2.6% real), the target date slips to 2034, age 46.',
      ],
      actions: [
        'Direct more of new contributions into your ISA rather than pension to build bridge liquidity.',
        'Model a phased retirement: part-time income of £20K/yr from 45 raises success probability to ~93%.',
        'Review BP concentration — it is the single largest risk to this timeline.',
      ],
      confidence: 'Moderate',
    },
  },
  {
    match: /house|home|rent|600/i,
    answer: {
      summary: 'Buying a £600K home is affordable, but it would delay Financial Freedom by roughly 2.5 years.',
      facts: [
        'Your Home Purchase goal holds £122K against a £250K target.',
        'Existing mortgage on the Reading buy-to-let is £95K at 4.29% fixed to 2028.',
        'Cash reserves are £41,950 (9.3 months of expenses).',
      ],
      assumptions: [
        '15% deposit (£90K) plus £28K stamp duty and costs; 25-year mortgage at 4.6%.',
        'Current rent of £2,150/month; UK house prices grow 2.5% per year.',
      ],
      analysis: [
        'Monthly mortgage costs would be ~£2,860 — £710 more than rent — reducing investable contributions.',
        'Using the Home Purchase fund now removes £122K from compounding; Financial Freedom moves from March 2031 to about September 2033.',
        'Renting and investing the difference outperforms buying in 62% of simulated paths over 10 years, but buying provides GBP housing stability.',
      ],
      actions: [
        'Consider a £450–500K purchase: the delay to Financial Freedom falls to ~10 months.',
        'If buying, keep at least 6 months of expenses in cash after completion.',
        'Hold the deposit in short-dated gilts or cash — not equities — given the 2029 horizon.',
      ],
      confidence: 'Moderate',
    },
  },
  {
    match: /tech|30%|fall|crash/i,
    answer: {
      summary: 'A 30% fall in US technology would reduce your net worth by an estimated £78K (-9.5%).',
      facts: [
        'Technology represents 41% of investable assets, including indirect exposure through ETFs and pension funds.',
        'Effective Nvidia ecosystem exposure is 21.1% of the portfolio.',
      ],
      assumptions: [
        'US tech falls 30%; the broader US market falls ~14%; GBP strengthens modestly against USD.',
        'Historical correlation of 0.82 between your tech holdings and global ETFs during drawdowns.',
      ],
      analysis: [
        'Direct holdings (NVDA, MSFT, NBIS, MU, TSM) would lose ~£47K; ETFs and pension funds a further ~£31K.',
        'Financial Freedom probability falls from 87% to 74%; the target date moves ~14 months later.',
        'Liquidity is unaffected: cash and bonds cover 11 months of expenses.',
      ],
      actions: [
        'Reduce single-name technology by 8%; this cuts scenario losses by ~£19K with little change to expected return.',
        'Redirect new contributions to global small caps or ex-US equity until tech is back near 33%.',
        'Avoid selling into the decline — historically you outperform when holding beyond 12 months.',
      ],
      confidence: 'High',
    },
  },
  {
    match: /overexpos|concentrat|expos/i,
    answer: {
      summary: 'You are most overexposed to BP (employer risk), the Nvidia ecosystem, and the US dollar.',
      facts: [
        'BP represents 28.2% of your liquid portfolio and is also your employer.',
        'Effective Nvidia ecosystem exposure is 21.1% — double the 10.2% direct position.',
        'USD is 51% of the portfolio; GBP 29%, INR 16%.',
      ],
      assumptions: ['Your future spending is ~70% GBP and ~30% INR based on your goals.', 'A 10% single-position limit is appropriate for your risk profile.'],
      analysis: [
        'BP concentration links your salary, pension and savings to one company — the highest-impact risk in your plan.',
        'Currency mismatch: a 15% GBP rally against USD would reduce portfolio value by ~£47K in sterling terms.',
      ],
      actions: [
        'Phase BP holdings down to ~10% over 12–18 months to manage tax and timing.',
        'Consider GBP-hedged share classes for part of your US equity exposure.',
        'Use the Hidden Exposure view to review overlap before adding any new tech position.',
      ],
      confidence: 'High',
    },
  },
  {
    match: /educat|child/i,
    answer: {
      summary: 'Yes — with a £300/month increase you can fully fund education and keep your 2031 retirement target.',
      facts: [
        "Children's Education holds £61K of a £180K target for 2038.",
        'Current contribution is £450/month; probability of success is 78%.',
      ],
      assumptions: ['UK university costs rise 3.5% per year.', '6.0% expected real return with a glide path to bonds from 2034.'],
      analysis: [
        'Raising contributions to £750/month lifts probability to 91%.',
        'Funding this from surplus cash flow, not from the Financial Freedom pot, keeps the March 2031 date unchanged.',
        'A Junior ISA for each child would shelter £9K/year of growth from tax.',
      ],
      actions: ['Open two Junior ISAs and redirect the education contribution into them.', 'Increase the monthly contribution to £750 from next month.'],
      confidence: 'High',
    },
  },
  {
    match: /isa/i,
    answer: {
      summary: 'Yes — using your remaining £8,500 ISA allowance is the most efficient next step.',
      facts: [
        'You have used £11,500 of your £20,000 ISA allowance for 2026/27.',
        '£44,200 of Microsoft and £28,500 of Nebius are held in a taxable GIA.',
      ],
      assumptions: ['Higher-rate taxpayer; capital gains annual exempt amount of £3,000.', 'Holdings continue to be held for 5+ years.'],
      analysis: [
        'Moving £8,500 via Bed & ISA saves an estimated £2,300 in future tax over 10 years.',
        'Selling part of the GIA position realises ~£1,300 of gains — within your annual exemption.',
      ],
      actions: ['Bed & ISA £8,500 of Microsoft before 5 April 2027.', 'Set up a monthly ISA contribution so next year’s allowance is used automatically.'],
      confidence: 'High',
    },
  },
]

const fallback: AdvisorAnswer = {
  summary: 'Overall, your portfolio supports your goals, but concentration risk is the main thing to watch.',
  facts: [
    'Net worth: £824,350 (+4.4% this month).',
    'Four of five goals are on track or ahead; India Retirement is slightly behind at 64% probability.',
    'Portfolio health score is 82/100, with risk concentration the weakest factor (69).',
  ],
  assumptions: ['Expected real returns of 3.5–6.4% depending on goal and asset mix.', 'Contributions continue at current levels.'],
  analysis: [
    'Financial Freedom is ~11 months ahead of plan due to strong technology returns.',
    'That same technology exposure (41%) is the biggest source of downside risk to every goal.',
    'India Retirement needs 7.1% returns versus 6.4% expected — a small gap that can be closed with contributions.',
  ],
  actions: [
    'Rebalance 8% from single-name tech into global diversified equity.',
    'Increase India Retirement contributions by £350/month.',
    'Use the remaining £8,500 ISA allowance.',
  ],
  confidence: 'Moderate',
}

export function answerQuestion(question: string): AdvisorAnswer {
  return answers.find((a) => a.match.test(question))?.answer ?? fallback
}
