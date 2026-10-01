import { ArrowDown, ArrowRight } from 'lucide-react'
import { LogoMark } from '@/components/brand/logo-mark'

const sources = ['Xplan', 'Investment platforms', 'Risk profiling', 'Fund information', 'Client documents', 'Meeting notes']
const outputs = ['Reviews', 'Client briefs', 'Suitability drafts', 'Alerts', 'Tasks', 'Documents', 'Adviser decisions']

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/70">{title}</p>
      <ul className="flex flex-wrap gap-1.5 lg:flex-col">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1.5 text-sm text-sidebar-accent-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Connector() {
  return (
    <div aria-hidden className="flex items-center justify-center text-sidebar-primary">
      <ArrowDown className="size-4 lg:hidden" />
      <ArrowRight className="hidden size-4 lg:block" />
    </div>
  )
}

export function ProductConcept() {
  return (
    <section aria-labelledby="concept" className="overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground md:p-8">
      <div className="max-w-2xl">
        <h2 id="concept" className="font-serif text-3xl font-medium tracking-tight text-sidebar-accent-foreground text-balance">
          Your AI copilot for client work.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty">
          Bring client data, portfolios, risk information and documents together. AdviserOS prepares the work,
          surfaces what needs attention and leaves judgement with the adviser.
        </p>
        <p className="mt-3 text-sm font-medium text-sidebar-primary">Less administration. More time with clients.</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
        <Column title="Systems of record" items={sources} />
        <Connector />
        <div className="flex flex-col items-center gap-2 rounded-xl border border-sidebar-primary/40 bg-sidebar-accent px-6 py-6 text-center lg:w-56">
          <LogoMark className="size-10 text-xl" />
          <p className="text-sm font-semibold text-sidebar-accent-foreground">AdviserOS</p>
          <p className="text-xs">Intelligence and workflow layer</p>
        </div>
        <Connector />
        <Column title="Prepared for you" items={outputs} />
      </div>

      <p className="mt-8 border-t border-sidebar-border pt-4 text-sm text-pretty">
        Existing systems remain systems of record. AdviserOS becomes the intelligence and workflow layer above
        them.
      </p>
    </section>
  )
}
