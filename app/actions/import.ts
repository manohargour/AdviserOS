'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { personalAccounts, personalConnections, personalHoldings } from '@/lib/db/schema'
import { requirePersonal } from '@/lib/roles'
import { ensurePersonalTables } from '@/lib/personal/store'
import { parseStatement, type ParsedPortfolio } from '@/lib/personal/import'
import { toBase } from '@/lib/personal/fx'

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB

export type PreviewResult = { ok: true; portfolio: ParsedPortfolio } | { ok: false; error: string }

export async function previewStatement(formData: FormData): Promise<PreviewResult> {
  await requirePersonal()
  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Please choose a file to upload.' }
  if (file.size === 0) return { ok: false, error: 'That file is empty.' }
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'That file is too large (max 2 MB).' }

  const name = file.name.toLowerCase()
  const isCsv = name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel'
  if (!isCsv) {
    return { ok: false, error: 'Please upload a CSV file. PDF and Excel statements are coming soon.' }
  }

  const text = await file.text()
  return parseStatement(file.name, text)
}

const holdingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  ticker: z.string().trim().max(24).default(''),
  isin: z.string().trim().max(20).default(''),
  quantity: z.coerce.number().min(0).max(1e12).default(0),
  unitPrice: z.coerce.number().min(0).max(1e12).default(0),
  value: z.coerce.number().min(0).max(1e12),
  currency: z.string().trim().max(8).default('GBP'),
  assetClass: z.enum(['Equity', 'Bonds', 'Property', 'Cash', 'Alternatives']).default('Equity'),
})

const confirmSchema = z.object({
  provider: z.string().trim().min(1).max(60),
  connectionType: z.enum(['manual', 'document', 'api_key', 'oauth']).default('document'),
  accountName: z.string().trim().min(1).max(80),
  accountType: z.string().trim().max(40).default('brokerage'),
  holdings: z.array(holdingSchema).min(1).max(1000),
})

export type ConfirmResult = { ok: true; accountId: number; count: number } | { ok: false; error: string }

const WRAPPER_LABEL: Record<string, string> = { isa: 'ISA', sipp: 'SIPP', pension: 'Pension', demat: 'Demat', gia: 'GIA' }

function regionForCurrency(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'USD':
      return 'US'
    case 'INR':
      return 'India'
    case 'EUR':
      return 'Europe'
    case 'GBP':
      return 'UK'
    default:
      return 'Global'
  }
}

export async function confirmImport(input: unknown): Promise<ConfirmResult> {
  const user = await requirePersonal()
  const parsed = confirmSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid import data' }
  await ensurePersonalTables()
  const data = parsed.data
  const wrapper = WRAPPER_LABEL[data.accountType.toLowerCase()] ?? 'GIA'

  try {
    const accountId = await db.transaction(async (tx) => {
      const [connection] = await tx
        .insert(personalConnections)
        .values({
          userId: user.id,
          provider: data.provider,
          connectionType: data.connectionType,
          status: 'connected',
          label: data.accountName,
          lastSyncAt: new Date(),
        })
        .returning({ id: personalConnections.id })

      const accountValueGbp = Math.round(data.holdings.reduce((s, h) => s + toBase(h.value, h.currency), 0))

      const [account] = await tx
        .insert(personalAccounts)
        .values({
          userId: user.id,
          name: data.accountName,
          type: data.accountType,
          kind: 'investment',
          value: accountValueGbp,
          region: regionForCurrency(data.holdings[0].currency),
          status: 'Connected',
          connectionId: connection.id,
        })
        .returning({ id: personalAccounts.id })

      await tx.insert(personalHoldings).values(
        data.holdings.map((h) => ({
          userId: user.id,
          accountId: account.id,
          connectionId: connection.id,
          name: h.name,
          ticker: h.ticker,
          isin: h.isin,
          quantity: h.quantity,
          unitPrice: h.unitPrice,
          value: Math.round(toBase(h.value, h.currency)),
          assetClass: h.assetClass,
          accountLabel: wrapper,
          sector: 'Diversified',
          region: regionForCurrency(h.currency),
          currency: h.currency.toUpperCase(),
        })),
      )

      return account.id
    })

    revalidatePath('/me', 'layout')
    return { ok: true, accountId, count: data.holdings.length }
  } catch {
    return { ok: false, error: 'Something went wrong saving your portfolio. Please try again.' }
  }
}
