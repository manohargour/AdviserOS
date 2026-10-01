import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const stats = [
  { value: '15', label: 'Reviews due', href: '/reviews', note: '6 this week' },
  { value: '6', label: 'Clients need attention', href: '/alerts', note: '1 high priority' },
  { value: '8', label: 'Drafts ready for approval', href: '/reviews', note: 'Prepared by AdviserOS' },
  { value: '31 hrs', label: 'Estimated admin time saved this month', href: '/settings', note: '+6 hrs vs September' },
]

export function StatCards() {
  return (
    <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/25"
        >
          <div className="flex items-start justify-between">
            <p className="font-serif text-4xl font-medium tabular-nums tracking-tight">{stat.value}</p>
            <ArrowUpRight
              aria-hidden
              className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
          <p className="mt-2 text-sm font-medium text-pretty">{stat.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stat.note}</p>
        </Link>
      ))}
    </section>
  )
}
