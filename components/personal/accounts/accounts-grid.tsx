'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { addAccount, deleteAccount, loadSample, updateAccount } from '@/app/actions/personal-data'
import type { AccountRow } from '@/lib/personal/store'
import { formatGBP } from '@/lib/personal/format'
import { Dot, PageHeader, Panel, Pill } from '@/components/personal/wealth/primitives'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/personal/ui/sheet'
import { cn } from '@/lib/utils'

const KINDS: { value: AccountRow['kind']; label: string }[] = [
  { value: 'investment', label: 'Investment' },
  { value: 'property', label: 'Property' },
  { value: 'cash', label: 'Cash' },
  { value: 'liability', label: 'Liability' },
]

const REGIONS = ['UK', 'US', 'India', 'Europe', 'Global', 'Multi']

const field = 'h-9 w-full rounded-lg border bg-card px-3 text-[13px] outline-none focus:border-ring/50 focus:ring-3 focus:ring-ring/15'

type Draft = {
  name: string
  type: string
  kind: AccountRow['kind']
  value: number
  region: string
  status: 'Connected' | 'Manual'
}

const emptyDraft: Draft = { name: '', type: '', kind: 'investment', value: 0, region: 'UK', status: 'Manual' }

function AccountSheet({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: Draft
  onSave: (draft: Draft) => void
  saving: boolean
}) {
  const [draft, setDraft] = useState<Draft>(initial)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSave(draft)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{initial.name ? 'Edit account' : 'Add an account'}</SheetTitle>
          <SheetDescription>Track a holding account, property, cash balance or liability.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <div>
            <label htmlFor="acc-name" className="mb-1.5 block text-[13px] font-medium">Name</label>
            <input id="acc-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Vanguard ISA" className={field} required />
          </div>
          <div>
            <label htmlFor="acc-type" className="mb-1.5 block text-[13px] font-medium">Description</label>
            <input id="acc-type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} placeholder="e.g. Stocks & Shares ISA" className={field} />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium">Type</legend>
            <div className="grid grid-cols-4 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, kind: k.value })}
                  aria-pressed={draft.kind === k.value}
                  className={cn('rounded-xl border p-2 text-[12px] transition-colors', draft.kind === k.value ? 'border-primary bg-muted font-medium' : 'text-muted-foreground hover:bg-muted')}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="acc-value" className="mb-1.5 block text-[13px] font-medium">
                {draft.kind === 'liability' ? 'Amount owed (£)' : 'Value (£)'}
              </label>
              <input
                id="acc-value"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) || 0 })}
                className={cn(field, 'num')}
              />
            </div>
            <div>
              <label htmlFor="acc-region" className="mb-1.5 block text-[13px] font-medium">Region</label>
              <select id="acc-region" value={draft.region} onChange={(e) => setDraft({ ...draft, region: e.target.value })} className={field}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!draft.name.trim() || saving}
            className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial.name ? 'Save changes' : 'Add account'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function AccountsGrid({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sheet, setSheet] = useState<{ open: boolean; id?: number; initial: Draft }>({ open: false, initial: emptyDraft })
  const total = accounts.reduce((s, a) => s + a.value, 0)

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        setSheet((s) => ({ ...s, open: false }))
        router.refresh()
      } else if (result.error) {
        alert(result.error)
      }
    })
  }

  function openAdd() {
    setSheet({ open: true, initial: emptyDraft })
  }

  function openEdit(a: AccountRow) {
    setSheet({
      open: true,
      id: a.id,
      initial: { name: a.name, type: a.type, kind: a.kind, value: Math.abs(a.value), region: a.region, status: a.status },
    })
  }

  function save(draft: Draft) {
    run(() => (sheet.id ? updateAccount(sheet.id, draft) : addAccount(draft)))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Accounts"
        title="Your accounts"
        description={accounts.length ? `${accounts.length} account${accounts.length === 1 ? '' : 's'} across your net worth` : 'Add your accounts to build your net worth'}
        actions={
          <>
            {accounts.length === 0 ? (
              <button type="button" onClick={() => run(() => loadSample())} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-medium hover:bg-muted disabled:opacity-60">
                Load sample data
              </button>
            ) : null}
            <button type="button" onClick={openAdd} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" aria-hidden />Add account
            </button>
          </>
        }
      />

      <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[12px] text-muted-foreground">Net across all accounts</p>
          <p className={cn('num text-2xl font-semibold tracking-tight', total < 0 && 'text-negative')}>{formatGBP(total)}</p>
        </div>
        <p className="max-w-md text-[12px] text-muted-foreground text-pretty">
          Accounts are entered and maintained by you. Values update your net worth, allocation and goals instantly.
        </p>
      </Panel>

      {accounts.length === 0 ? (
        <Panel className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm font-medium">No accounts yet</p>
          <p className="max-w-sm text-[13px] text-muted-foreground">Add your investment accounts, property, cash and liabilities to see your complete financial picture.</p>
          <button type="button" onClick={openAdd} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" aria-hidden />Add your first account
          </button>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <Panel key={a.id} className="group flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-[12px] font-semibold">
                    {a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <h2 className="text-[14px] font-semibold">{a.name}</h2>
                    <p className="text-[12px] text-muted-foreground">{a.type || KINDS.find((k) => k.value === a.kind)?.label}</p>
                  </div>
                </div>
                <Pill tone={a.kind === 'liability' ? 'negative' : 'neutral'}>
                  <Dot tone={a.kind === 'liability' ? 'negative' : 'neutral'} />
                  {KINDS.find((k) => k.value === a.kind)?.label}
                </Pill>
              </div>
              <p className={cn('num mt-5 text-xl font-semibold tracking-tight', a.value < 0 && 'text-negative')}>{formatGBP(a.value)}</p>
              <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted-foreground">
                <span>{a.region}</span>
                <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" onClick={() => openEdit(a)} aria-label={`Edit ${a.name}`} className="rounded p-1 hover:bg-muted hover:text-foreground">
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${a.name}?`)) run(() => deleteAccount(a.id))
                    }}
                    aria-label={`Delete ${a.name}`}
                    className="rounded p-1 hover:bg-muted hover:text-negative"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </span>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {sheet.open ? (
        <AccountSheet
          key={sheet.id ?? 'new'}
          open={sheet.open}
          onOpenChange={(v) => setSheet((s) => ({ ...s, open: v }))}
          initial={sheet.initial}
          onSave={save}
          saving={pending}
        />
      ) : null}
    </div>
  )
}
