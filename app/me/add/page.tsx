import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileUp, PencilLine, ShieldCheck } from 'lucide-react'
import { requirePersonal } from '@/lib/roles'
import { PageHeader, Panel } from '@/components/personal/wealth/primitives'
import { StatementImport } from '@/components/personal/add/statement-import'

export const metadata: Metadata = { title: 'Add investments' }

function ProviderCard({ name, note, status }: { name: string; note: string; status: 'available' | 'soon' }) {
  return (
    <Panel className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-[13px] font-semibold">
          {name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </span>
        <span className={status === 'available' ? 'text-[11px] font-medium text-emerald-600' : 'rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'}>
          {status === 'available' ? 'Available' : 'Coming soon'}
        </span>
      </div>
      <div>
        <h3 className="text-[14px] font-semibold">{name}</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground text-pretty">{note}</p>
      </div>
    </Panel>
  )
}

export default async function AddInvestmentsPage() {
  await requirePersonal()
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Add investments" title="Build your wealth picture" description="Bring your investments together from across the UK and India." />

      <section aria-labelledby="connect" className="flex flex-col gap-3">
        <h2 id="connect" className="text-sm font-semibold">Connect automatically</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProviderCard name="Trading 212" status="available" note="Export your statement from Trading 212 and upload it below — we import your holdings automatically." />
          <ProviderCard name="Zerodha" status="soon" note="Secure Zerodha connection is coming soon. For now, upload a CAS or CSV statement below." />
        </div>
        <p className="text-[12px] text-muted-foreground">
          Don&apos;t see your provider? Upload a statement and we&apos;ll import your portfolio automatically.
        </p>
      </section>

      <section aria-labelledby="upload" className="flex flex-col gap-3">
        <h2 id="upload" className="flex items-center gap-2 text-sm font-semibold">
          <FileUp className="size-4 text-muted-foreground" aria-hidden />
          Upload a statement
        </h2>
        <StatementImport />
      </section>

      <section aria-labelledby="other" className="flex flex-col gap-3">
        <h2 id="other" className="text-sm font-semibold">Other ways to add your wealth</h2>
        <Link
          href="/me/accounts"
          className="group flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PencilLine className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-[14px] font-semibold">Add manually</span>
              <span className="block text-[12px] text-muted-foreground">Property, cash, pensions or any account you prefer to track by hand.</span>
            </span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>

      <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
        <ShieldCheck className="size-3.5" aria-hidden />
        No trading. No financial advice. Your data stays yours.
      </p>
    </div>
  )
}
