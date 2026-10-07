import { Building2, Landmark, TrendingUp, Wallet } from 'lucide-react'
import type { NetWorth } from '@/lib/personal/store'
import { formatGBP } from '@/lib/personal/format'
import { Panel } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

export function SummaryCards({ netWorth }: { netWorth: NetWorth }) {
  const cards = [
    { label: 'Investments', value: netWorth.investments, detail: 'Across your investment accounts', icon: TrendingUp },
    { label: 'Property', value: netWorth.property, detail: 'Property you hold', icon: Building2 },
    { label: 'Cash', value: netWorth.cash, detail: 'Cash and savings', icon: Wallet },
    { label: 'Liabilities', value: netWorth.liabilities, detail: 'Mortgages and loans', icon: Landmark, invert: true },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, detail, icon: Icon, invert }) => (
        <Panel key={label} className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
          </div>
          <p className={cn('num mt-2 text-xl font-semibold tracking-tight', invert && 'text-foreground/80')}>{formatGBP(value)}</p>
          <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="truncate text-muted-foreground">{detail}</span>
          </div>
        </Panel>
      ))}
    </div>
  )
}
