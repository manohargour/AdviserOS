import { Building2, Landmark, TrendingUp, Wallet } from 'lucide-react'
import { netWorth } from '@/lib/personal/data'
import { formatGBP } from '@/lib/personal/format'
import { Delta, Panel } from '@/components/personal/wealth/primitives'
import { cn } from '@/lib/utils'

const cards = [
  { label: 'Investments', value: netWorth.investments, change: 5.1, detail: '13 holdings · 6 accounts', icon: TrendingUp },
  { label: 'Property', value: netWorth.property, change: 0.4, detail: 'Buy-to-let, Reading', icon: Building2 },
  { label: 'Cash', value: netWorth.cash, change: 1.2, detail: '9.3 months of expenses', icon: Wallet },
  { label: 'Liabilities', value: netWorth.liabilities, change: -0.8, detail: 'Mortgage · 4.29% fixed', icon: Landmark, invert: true },
]

export function SummaryCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ label, value, change, detail, icon: Icon, invert }) => (
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
            {invert ? (
              <span className="num shrink-0 font-medium text-positive">{change}%</span>
            ) : (
              <Delta value={change} className="shrink-0 text-[12px]" />
            )}
          </div>
        </Panel>
      ))}
    </div>
  )
}
