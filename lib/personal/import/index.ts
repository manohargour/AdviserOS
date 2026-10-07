import { parseCsv } from './csv'
import { genericCsvParser } from './generic'
import { trading212Parser } from './trading212'
import type { ParseResult, StatementParser } from './types'

// Order matters: more specific parsers first, generic last.
export const PARSERS: StatementParser[] = [trading212Parser, genericCsvParser]

export type { ParsedHolding, ParsedPortfolio, ParseResult } from './types'

/** Detects the provider/format from a CSV file and parses it to a canonical portfolio. */
export function parseStatement(fileName: string, text: string): ParseResult {
  const { headers, rows } = parseCsv(text)
  if (headers.length === 0 || rows.length === 0) {
    return { ok: false, error: 'The file is empty or not a readable CSV.' }
  }
  const parser = PARSERS.find((p) => p.detect({ fileName, headers }))
  if (!parser) {
    return { ok: false, error: "We couldn't recognise this file. Make sure it's a CSV with your holdings or a Trading 212 export." }
  }
  return parser.parse({ fileName, headers, rows })
}
