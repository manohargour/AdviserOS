export function ChartTooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color ? <span className="size-2 rounded-full" style={{ background: r.color }} /> : null}
              {r.label}
            </span>
            <span className="num font-semibold text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
