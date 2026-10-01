import { gbp, type AssetClass } from '@/lib/data'

const colors: Record<AssetClass, string> = {
  Equity: 'bg-chart-1',
  Bonds: 'bg-chart-2',
  Property: 'bg-chart-3',
  Alternatives: 'bg-chart-4',
  Cash: 'bg-chart-5',
}

export function AllocationBar({ rows }: { rows: { assetClass: AssetClass; value: number; pct: number }[] }) {
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {rows.map((r) => (
          <div key={r.assetClass} className={colors[r.assetClass]} style={{ width: `${r.pct}%` }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {rows.map((r) => (
          <li key={r.assetClass}>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className={`size-2 rounded-full ${colors[r.assetClass]}`} />
              {r.assetClass}
            </p>
            <p className="mt-0.5 font-serif text-xl tabular-nums">{r.pct.toFixed(1)}%</p>
            <p className="text-xs tabular-nums text-muted-foreground">{gbp(r.value)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
