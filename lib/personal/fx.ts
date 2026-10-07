/**
 * Minimal FX conversion to the household base currency (GBP for now).
 *
 * Rates are static placeholders so multi-currency imports produce a coherent
 * GBP net worth. Replace with a live FX service (cached centrally) later —
 * keep the `toBase` signature so callers don't change.
 */
export const BASE_CURRENCY = 'GBP'

// Units of base currency (GBP) per 1 unit of the given currency.
const RATES_TO_GBP: Record<string, number> = {
  GBP: 1,
  USD: 0.79,
  EUR: 0.85,
  INR: 0.0095,
  CAD: 0.58,
  AUD: 0.52,
  CHF: 0.88,
  JPY: 0.0052,
  SGD: 0.59,
  HKD: 0.1,
}

export function normalizeCurrency(code: string | undefined | null): string {
  const c = (code ?? '').trim().toUpperCase()
  return c in RATES_TO_GBP ? c : c.length === 3 ? c : BASE_CURRENCY
}

/** Converts an amount in `currency` to the base currency (GBP). */
export function toBase(amount: number, currency: string): number {
  const code = normalizeCurrency(currency)
  const rate = RATES_TO_GBP[code] ?? 1
  return amount * rate
}

export function isSupportedCurrency(code: string): boolean {
  return normalizeCurrency(code) in RATES_TO_GBP
}
