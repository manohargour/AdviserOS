import { parseAmount } from './csv'
import { guessAssetClass, pickHeader, type ParseResult, type ParsedHolding, type StatementParser } from './types'

/**
 * Flexible positions/holdings CSV: one row per holding with columns for
 * name, ticker, (optional) ISIN, quantity, price and/or value, and currency.
 * Works for most broker "portfolio" or "positions" exports, including a
 * Trading 212 holdings export.
 */
export const genericCsvParser: StatementParser = {
  id: 'generic-csv',
  label: 'Positions CSV',

  detect({ headers }) {
    const name = pickHeader(headers, ['name', 'instrument', 'security', 'holding', 'fund', 'stock'])
    const value = pickHeader(headers, ['value', 'marketvalue', 'currentvalue', 'amount', 'total'])
    const qty = pickHeader(headers, ['quantity', 'shares', 'units', 'noofshares'])
    const price = pickHeader(headers, ['price', 'pricepershare', 'marketprice', 'currentprice'])
    return Boolean(name && (value || (qty && price)))
  },

  parse({ headers, rows }): ParseResult {
    const nameKey = pickHeader(headers, ['name', 'instrument', 'security', 'holding', 'fund', 'stock'])
    const tickerKey = pickHeader(headers, ['ticker', 'symbol', 'code'])
    const isinKey = pickHeader(headers, ['isin'])
    const qtyKey = pickHeader(headers, ['quantity', 'shares', 'units', 'noofshares'])
    const priceKey = pickHeader(headers, ['price', 'pricepershare', 'marketprice', 'currentprice'])
    const valueKey = pickHeader(headers, ['value', 'marketvalue', 'currentvalue', 'amount', 'total'])
    const currencyKey = pickHeader(headers, ['currency', 'ccy'])

    if (!nameKey) return { ok: false, error: 'Could not find a column with the holding name.' }

    const holdings: ParsedHolding[] = []
    for (const row of rows) {
      const name = (row[nameKey] ?? '').trim()
      if (!name) continue
      const ticker = tickerKey ? (row[tickerKey] ?? '').trim() : ''
      const isin = isinKey ? (row[isinKey] ?? '').trim() : ''
      const quantity = qtyKey ? parseAmount(row[qtyKey]) : 0
      const unitPrice = priceKey ? parseAmount(row[priceKey]) : 0
      const explicitValue = valueKey ? parseAmount(row[valueKey]) : 0
      const value = explicitValue > 0 ? explicitValue : quantity * unitPrice
      if (value <= 0 && quantity <= 0) continue
      const currency = (currencyKey ? row[currencyKey] : '')?.trim() || 'GBP'
      holdings.push({ name, ticker, isin, quantity, unitPrice, value, currency, assetClass: guessAssetClass(name, ticker) })
    }

    if (holdings.length === 0) return { ok: false, error: 'No holdings with a value or quantity were found in the file.' }

    const currency = holdings[0].currency
    return {
      ok: true,
      portfolio: {
        provider: 'CSV import',
        accountName: 'Imported account',
        accountType: 'brokerage',
        currency,
        holdings,
        totalValue: holdings.reduce((s, h) => s + h.value, 0),
        notes: [],
      },
    }
  },
}
