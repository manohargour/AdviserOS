/**
 * Minimal, dependency-free CSV parser.
 * Handles quoted fields, escaped quotes ("") and commas/newlines inside quotes.
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field)
      records.push(record)
      field = ''
      record = []
    } else {
      field += char
    }
  }
  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmpty.length === 0) return { headers: [], rows: [] }

  const headers = nonEmpty[0].map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((r) => {
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (r[idx] ?? '').trim()
    })
    return row
  })
  return { headers, rows }
}

/** Parses a number from a string, tolerating currency symbols, commas and spaces. */
export function parseAmount(value: string | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.\-]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}
