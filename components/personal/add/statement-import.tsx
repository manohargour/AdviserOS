'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import { confirmImport, previewStatement } from '@/app/actions/import'
import type { ParsedHolding, ParsedPortfolio } from '@/lib/personal/import'
import { Panel } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

const ACCOUNT_TYPES = [
  { value: 'brokerage', label: 'General investment' },
  { value: 'isa', label: 'ISA' },
  { value: 'sipp', label: 'SIPP / pension' },
  { value: 'demat', label: 'Demat (India)' },
  { value: 'gia', label: 'Other' },
]

const field = 'h-9 rounded-lg border bg-card px-3 text-[13px] outline-none focus:border-ring/50 focus:ring-3 focus:ring-ring/15'

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`
  }
}

type Draft = ParsedPortfolio & { accountType: string }

export function StatementImport() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)

  function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    startTransition(async () => {
      const result = await previewStatement(formData)
      if (result.ok) {
        setDraft({ ...result.portfolio, accountType: result.portfolio.accountType || 'brokerage' })
      } else {
        setError(result.error)
        setDraft(null)
      }
    })
  }

  function updateHolding(index: number, patch: Partial<ParsedHolding>) {
    setDraft((d) => (d ? { ...d, holdings: d.holdings.map((h, i) => (i === index ? { ...h, ...patch } : h)) } : d))
  }

  function removeHolding(index: number) {
    setDraft((d) => (d ? { ...d, holdings: d.holdings.filter((_, i) => i !== index) } : d))
  }

  function confirm() {
    if (!draft) return
    startTransition(async () => {
      const result = await confirmImport({
        provider: draft.provider,
        connectionType: 'document',
        accountName: draft.accountName.trim() || draft.provider,
        accountType: draft.accountType,
        holdings: draft.holdings,
      })
      if (result.ok) {
        router.push('/me/portfolio')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  if (!draft) {
    return (
      <Panel className="flex flex-col items-center gap-4 border-dashed p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileSpreadsheet className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium">Upload an investment statement</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
            Export a CSV from your broker — including a Trading 212 export — and we&apos;ll import your holdings. We detect the format automatically.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Upload className="size-4" aria-hidden />
          {pending ? 'Reading…' : 'Choose CSV file'}
        </button>
        {error ? (
          <p className="flex items-center gap-1.5 text-[13px] text-negative">
            <AlertTriangle className="size-3.5" aria-hidden />
            {error}
          </p>
        ) : null}
      </Panel>
    )
  }

  const total = draft.holdings.reduce((s, h) => s + h.value, 0)

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b bg-muted/30 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold">We found your portfolio</p>
            <p className="text-[13px] text-muted-foreground">
              {draft.provider} · {draft.holdings.length} holding{draft.holdings.length === 1 ? '' : 's'} · {money(total, draft.currency)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-col gap-1">
            <label htmlFor="imp-name" className="text-[11px] font-medium text-muted-foreground">Account name</label>
            <input id="imp-name" value={draft.accountName} onChange={(e) => setDraft({ ...draft, accountName: e.target.value })} className={cn(field, 'w-full sm:w-52')} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="imp-type" className="text-[11px] font-medium text-muted-foreground">Account type</label>
            <select id="imp-type" value={draft.accountType} onChange={(e) => setDraft({ ...draft, accountType: e.target.value })} className={cn(field, 'w-full sm:w-44')}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {draft.notes.length > 0 ? (
        <div className="flex items-start gap-2 border-b bg-warning-soft/60 px-5 py-2.5 text-[12px] text-foreground/80">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <p>{draft.notes.join(' ')}</p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="bg-muted/40 text-left text-[12px] text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Holding</th>
              <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
              <th className="px-3 py-2.5 text-right font-medium">Value</th>
              <th className="px-3 py-2.5 font-medium">Ccy</th>
              <th className="px-3 py-2.5 pr-5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {draft.holdings.map((h, i) => (
              <tr key={`${h.isin || h.ticker || h.name}-${i}`} className="hover:bg-muted/30">
                <td className="py-2.5 pr-3 pl-5">
                  <span className="block truncate font-medium">{h.name}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">{[h.ticker, h.isin].filter(Boolean).join(' · ')}</span>
                </td>
                <td className="num px-3 py-2.5 text-right text-muted-foreground">{h.quantity ? h.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    min={0}
                    value={Math.round(h.value)}
                    onChange={(e) => updateHolding(i, { value: Number(e.target.value) || 0 })}
                    aria-label={`Value of ${h.name}`}
                    className={cn(field, 'num h-8 w-28 text-right')}
                  />
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px] text-muted-foreground">{h.currency}</td>
                <td className="px-3 py-2.5 pr-5 text-right">
                  <button type="button" onClick={() => removeHolding(i)} aria-label={`Remove ${h.name}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-negative">
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground">Values are converted to GBP for your net worth. Edit any figure before importing.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setDraft(null); setError(null) }} disabled={pending} className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-60">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending || draft.holdings.length === 0}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? 'Importing…' : `Confirm ${draft.holdings.length} holding${draft.holdings.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
      {error ? <p className="flex items-center gap-1.5 px-5 pb-4 text-[13px] text-negative"><AlertTriangle className="size-3.5" aria-hidden />{error}</p> : null}
    </Panel>
  )
}
