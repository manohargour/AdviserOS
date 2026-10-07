import { describe, expect, it } from 'vitest'
import { parseAmount, parseCsv } from '@/lib/personal/import/csv'
import { parseStatement } from '@/lib/personal/import'
import { toBase } from '@/lib/personal/fx'

describe('parseCsv', () => {
  it('parses headers and rows', () => {
    const { headers, rows } = parseCsv('Name,Value\nApple,100\nTesla,200\n')
    expect(headers).toEqual(['Name', 'Value'])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ Name: 'Apple', Value: '100' })
  })

  it('handles quoted fields with commas', () => {
    const { rows } = parseCsv('Name,Value\n"Apple, Inc.","1,000"\n')
    expect(rows[0].Name).toBe('Apple, Inc.')
    expect(rows[0].Value).toBe('1,000')
  })

  it('handles escaped quotes', () => {
    const { rows } = parseCsv('Name\n"The ""Big"" One"\n')
    expect(rows[0].Name).toBe('The "Big" One')
  })
})

describe('parseAmount', () => {
  it('strips currency symbols and thousands separators', () => {
    expect(parseAmount('£1,234.50')).toBeCloseTo(1234.5)
    expect(parseAmount('$0')).toBe(0)
    expect(parseAmount('')).toBe(0)
  })
})

describe('toBase (FX)', () => {
  it('leaves GBP unchanged', () => {
    expect(toBase(100, 'GBP')).toBe(100)
  })
  it('converts other currencies toward GBP', () => {
    expect(toBase(100, 'USD')).toBeLessThan(100)
    expect(toBase(100, 'INR')).toBeLessThan(2)
  })
})

describe('parseStatement — generic positions CSV', () => {
  const csv = [
    'Name,Ticker,ISIN,Quantity,Price,Value,Currency',
    'Apple,AAPL,US0378331005,10,200,2000,USD',
    'Vanguard All-World,VWRL,,5,100,,GBP',
  ].join('\n')

  it('parses holdings and computes value from quantity×price when missing', () => {
    const result = parseStatement('positions.csv', csv)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.portfolio.holdings).toHaveLength(2)
    const apple = result.portfolio.holdings.find((h) => h.ticker === 'AAPL')!
    expect(apple.value).toBe(2000)
    const vwrl = result.portfolio.holdings.find((h) => h.ticker === 'VWRL')!
    expect(vwrl.value).toBe(500)
  })
})

describe('parseStatement — Trading 212 transactions', () => {
  const csv = [
    'Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Total',
    'Market buy,2026-01-01,US67066G1040,NVDA,NVIDIA,10,100,USD,1000',
    'Market buy,2026-02-01,US67066G1040,NVDA,NVIDIA,5,120,USD,600',
    'Market sell,2026-03-01,US67066G1040,NVDA,NVIDIA,3,130,USD,390',
    'Dividend (Ordinary),2026-03-02,US67066G1040,NVDA,NVIDIA,,,USD,5',
  ].join('\n')

  it('aggregates buys and sells into a net open position', () => {
    const result = parseStatement('transactions.csv', csv)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.portfolio.provider).toBe('Trading 212')
    expect(result.portfolio.holdings).toHaveLength(1)
    const nvda = result.portfolio.holdings[0]
    expect(nvda.quantity).toBeCloseTo(12)
    expect(nvda.unitPrice).toBe(130)
    expect(nvda.value).toBeCloseTo(1560)
    expect(nvda.currency).toBe('USD')
  })
})

describe('parseStatement — errors', () => {
  it('rejects an unrecognised file', () => {
    const result = parseStatement('x.csv', 'foo,bar\n1,2\n')
    expect(result.ok).toBe(false)
  })
})
