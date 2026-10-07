import { parseAmount } from './csv'
import { guessAssetClass, pickHeader, type ParseResult, type ParsedHolding, type StatementParser } from './types'

/**
 * Trading 212 transaction-history CSV. Trading 212's retail export is a list of
 * transactions, so we aggregate buys/sells into net open positions. Current
 * market value is estimated from the most recent price in the statement and is
 * shown for review/editing before import (no live price feed in this slice).
 */
export const trading212Parser: StatementParser = {
  id: 'trading212-csv',
  label: 'Trading 212',

  detect({ headers }) {
    const action = pickHeader(headers, ['action'])
    const shares = pickHeader(headers, ['noofshares', 'shares'])
    const price = pickHeader(headers, ['pricepershare', 'price'])
    const id = pickHeader(headers, ['name']) && (pickHeader(headers, ['ticker']) || pickHeader(headers, ['isin']))
    return Boolean(action && shares && price && id)
  },

  parse({ headers, rows }): ParseResult {
    const actionKey = pickHeader(headers, ['action'])
    const sharesKey = pickHeader(headers, ['noofshares', 'shares'])
    const priceKey = pickHeader(headers, ['pricepershare', 'price'])
    const priceCcyKey = pickHeader(headers, ['currencypriceshare', 'currencyprice'])
    const tickerKey = pickHeader(headers, ['ticker', 'symbol'])
    const isinKey = pickHeader(headers, ['isin'])
    const nameKey = pickHeader(headers, ['name', 'instrument'])
    const timeKey = pickHeader(headers, ['time', 'date'])

    if (!actionKey || !sharesKey || !priceKey || !nameKey) {
      return { ok: false, error: 'This does not look like a Trading 212 export.' }
    }

    type Agg = { name: string; ticker: string; isin: string; qty: number; cost: number; lastPrice: number; lastTime: string; currency: string }
    const positions = new Map<string, Agg>()

    for (const row of rows) {
      const action = (row[actionKey] ?? '').toLowerCase()
      const isBuy = action.includes('buy')
      const isSell = action.includes('sell')
      if (!isBuy && !isSell) continue // skip dividends, deposits, fees, etc.

      const name = (row[nameKey] ?? '').trim()
      const ticker = tickerKey ? (row[tickerKey] ?? '').trim() : ''
      const isin = isinKey ? (row[isinKey] ?? '').trim() : ''
      const key = isin || ticker || name
      if (!key) continue

      const shares = parseAmount(row[sharesKey])
      const price = parseAmount(row[priceKey])
      const time = timeKey ? (row[timeKey] ?? '') : ''
      const currency = (priceCcyKey ? row[priceCcyKey] : '')?.trim() || 'GBP'

      const agg = positions.get(key) ?? { name, ticker, isin, qty: 0, cost: 0, lastPrice: price, lastTime: time, currency }
      const signed = isBuy ? shares : -shares
      agg.qty += signed
      agg.cost += signed * price
      if (!agg.lastTime || time >= agg.lastTime) {
        agg.lastTime = time
        agg.lastPrice = price
        agg.currency = currency
      }
      positions.set(key, agg)
    }

    const holdings: ParsedHolding[] = []
    for (const p of positions.values()) {
      if (p.qty <= 1e-6) continue // closed or net-short positions are not open holdings
      const unitPrice = p.lastPrice
      holdings.push({
        name: p.name,
        ticker: p.ticker,
        isin: p.isin,
        quantity: p.qty,
        unitPrice,
        value: p.qty * unitPrice,
        currency: p.currency,
        assetClass: guessAssetClass(p.name, p.ticker),
      })
    }

    if (holdings.length === 0) return { ok: false, error: 'No open positions were found in this Trading 212 export.' }

    return {
      ok: true,
      portfolio: {
        provider: 'Trading 212',
        accountName: 'Trading 212',
        accountType: 'brokerage',
        currency: holdings[0].currency,
        holdings,
        totalValue: holdings.reduce((s, h) => s + h.value, 0),
        notes: ['Values are estimated from the latest price in your statement. Review and adjust before importing.'],
      },
    }
  },
}
