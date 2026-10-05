export type Scenario = {
  id: string
  label: string
  group: 'Markets' | 'Life'
  netWorth: number
  probability: number
  liquidityMonths: number
  retirementShiftMonths: number
  drawdown: number
  note: string
}

export const baseline = {
  netWorth: 824_350,
  probability: 87,
  liquidityMonths: 9.3,
  retirementDate: new Date(2031, 2, 1),
  drawdown: 0,
}

export const scenarios: Scenario[] = [
  { id: 'us-tech', label: 'US tech -30%', group: 'Markets', netWorth: -71_600, probability: -11, liquidityMonths: 0, retirementShiftMonths: 19, drawdown: -11.7, note: 'Look-through tech exposure is 41%, so a 30% fall hits ~£250K of assets — including pension funds that look diversified.' },
  { id: 'gbpusd', label: 'GBP/USD +15%', group: 'Markets', netWorth: -40_700, probability: -5, liquidityMonths: 0, retirementShiftMonths: 8, drawdown: -6.6, note: 'A stronger pound reduces the sterling value of your 51% USD assets. Spending in GBP is unaffected.' },
  { id: 'india', label: 'India equities +20%', group: 'Markets', netWorth: 24_500, probability: 3, liquidityMonths: 0, retirementShiftMonths: -4, drawdown: 0, note: 'Mainly benefits India Retirement (+6 pts) since India MF holdings are assigned there.' },
  { id: 'property', label: 'Property -10%', group: 'Markets', netWorth: -26_500, probability: -1, liquidityMonths: 0, retirementShiftMonths: 2, drawdown: 0, note: 'Buy-to-let equity falls to £143.5K. Rental yield, which funds your plan, is unchanged.' },
  { id: 'inflation', label: 'Inflation 6%', group: 'Markets', netWorth: -18_200, probability: -14, liquidityMonths: -1.4, retirementShiftMonths: 26, drawdown: -3.0, note: 'Real returns compress by ~3pp and your £50K spending target rises in nominal terms. Gold and property partly offset.' },
  { id: 'retire-early', label: 'Retire 5 years earlier', group: 'Life', netWorth: 0, probability: -38, liquidityMonths: 0, retirementShiftMonths: -60, drawdown: 0, note: 'Requires ~£1.49M by 2026 terms; pension access at 57 leaves a 17-year bridge funded only from ISA/GIA.' },
  { id: 'buy-home', label: 'Buy £600k home', group: 'Life', netWorth: -28_000, probability: -9, liquidityMonths: -5.1, retirementShiftMonths: 30, drawdown: 0, note: 'Uses £118K for deposit and costs. Net worth dips by transaction costs only, but investable assets fall sharply.' },
  { id: 'stop-work', label: 'Stop working next year', group: 'Life', netWorth: 0, probability: -52, liquidityMonths: -6.8, retirementShiftMonths: -52, drawdown: 0, note: 'Contributions stop and withdrawals begin at a 6.1% rate — above the sustainable range for a 50-year horizon.' },
]

export function combine(ids: string[]) {
  const picked = scenarios.filter((s) => ids.includes(s.id))
  const sum = picked.reduce(
    (acc, s) => ({
      netWorth: acc.netWorth + s.netWorth,
      probability: acc.probability + s.probability,
      liquidityMonths: acc.liquidityMonths + s.liquidityMonths,
      retirementShiftMonths: acc.retirementShiftMonths + s.retirementShiftMonths,
      drawdown: acc.drawdown + s.drawdown,
    }),
    { netWorth: 0, probability: 0, liquidityMonths: 0, retirementShiftMonths: 0, drawdown: 0 },
  )
  const retirement = new Date(baseline.retirementDate)
  retirement.setMonth(retirement.getMonth() + sum.retirementShiftMonths)
  return {
    picked,
    netWorth: baseline.netWorth + sum.netWorth,
    netWorthDelta: sum.netWorth,
    probability: Math.max(3, Math.min(99, baseline.probability + sum.probability)),
    probabilityDelta: sum.probability,
    liquidityMonths: Math.max(0, baseline.liquidityMonths + sum.liquidityMonths),
    liquidityDelta: sum.liquidityMonths,
    retirement,
    retirementShiftMonths: sum.retirementShiftMonths,
    drawdown: Math.max(-60, sum.drawdown),
  }
}
