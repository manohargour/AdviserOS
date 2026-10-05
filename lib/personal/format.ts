const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })

export function formatGBP(value: number, opts: { signed?: boolean } = {}) {
  const formatted = gbp.format(Math.abs(value))
  if (value < 0) return `-${formatted}`
  if (opts.signed && value > 0) return `+${formatted}`
  return formatted
}

export function formatCompactGBP(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`
  if (abs >= 1_000) return `${sign}£${Math.round(abs / 1_000)}K`
  return `${sign}£${Math.round(abs)}`
}

export function formatPct(value: number, opts: { signed?: boolean; digits?: number } = {}) {
  const digits = opts.digits ?? 1
  const s = `${Math.abs(value).toFixed(digits)}%`
  if (value < 0) return `-${s}`
  if (opts.signed && value > 0) return `+${s}`
  return s
}
