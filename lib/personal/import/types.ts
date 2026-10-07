import type { PersonalAssetClass } from '@/lib/db/schema'

export type ParsedHolding = {
  name: string
  ticker: string
  isin: string
  quantity: number
  unitPrice: number
  /** Market value in the holding's own currency. */
  value: number
  currency: string
  assetClass: PersonalAssetClass
}

export type ParsedPortfolio = {
  provider: string
  accountName: string
  accountType: string
  currency: string
  holdings: ParsedHolding[]
  /** Sum of holding values in the portfolio currency. */
  totalValue: number
  notes: string[]
}

export type ParseResult = { ok: true; portfolio: ParsedPortfolio } | { ok: false; error: string }

export interface StatementParser {
  id: string
  label: string
  /** Returns true if this parser recognises the file. */
  detect(input: { fileName: string; headers: string[] }): boolean
  parse(input: { fileName: string; headers: string[]; rows: Record<string, string>[] }): ParseResult
}

/** Finds the first row key that matches any of the candidate header names (case-insensitive, fuzzy). */
export function pickHeader(headers: string[], candidates: string[]): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }))
  for (const candidate of candidates) {
    const cn = norm(candidate)
    const exact = normalized.find((h) => h.n === cn)
    if (exact) return exact.raw
  }
  for (const candidate of candidates) {
    const cn = norm(candidate)
    const partial = normalized.find((h) => h.n.includes(cn))
    if (partial) return partial.raw
  }
  return null
}

const CLASS_HINTS: [RegExp, PersonalAssetClass][] = [
  [/bond|gilt|treasur|fixed income/i, 'Bonds'],
  [/cash|money market/i, 'Cash'],
  [/reit|property|real estate/i, 'Property'],
  [/gold|silver|commodit|crypto|bitcoin|private/i, 'Alternatives'],
]

export function guessAssetClass(name: string, ticker: string): PersonalAssetClass {
  const text = `${name} ${ticker}`
  for (const [re, cls] of CLASS_HINTS) if (re.test(text)) return cls
  return 'Equity'
}
