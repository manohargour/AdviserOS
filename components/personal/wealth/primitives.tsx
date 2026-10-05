import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card text-card-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className,
      )}
      {...props}
    />
  )
}

export function PanelHeader({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] text-muted-foreground text-pretty">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-1.5 text-xs font-medium text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Delta({ value, suffix, className }: { value: number; suffix?: string; className?: string }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('num inline-flex items-center gap-0.5 font-medium', up ? 'text-positive' : 'text-negative', className)}>
      <Icon className="size-3.5" aria-hidden />
      {up ? '+' : '-'}
      {Math.abs(value).toFixed(1)}
      {suffix ?? '%'}
    </span>
  )
}

export function AiMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'size-6 [&_svg]:size-3', md: 'size-8 [&_svg]:size-4', lg: 'size-10 [&_svg]:size-5' }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-ai-soft text-ai ring-1 ring-ai/15',
        sizes[size],
        className,
      )}
    >
      <Sparkles />
    </span>
  )
}

type Tone = 'positive' | 'warning' | 'negative' | 'neutral' | 'ai'

const toneClasses: Record<Tone, string> = {
  positive: 'bg-positive-soft text-positive',
  warning: 'bg-warning-soft text-warning',
  negative: 'bg-negative-soft text-negative',
  neutral: 'bg-muted text-muted-foreground',
  ai: 'bg-ai-soft text-ai-foreground',
}

export function Pill({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Dot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  const map: Record<Tone, string> = {
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
    neutral: 'bg-muted-foreground/50',
    ai: 'bg-ai',
  }
  return <span aria-hidden className={cn('inline-block size-1.5 rounded-full', map[tone], className)} />
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'sm',
}: {
  options: readonly { value: T; label: string }[] | readonly T[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const opts = (options as readonly (T | { value: T; label: string })[]).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex items-center rounded-lg bg-muted p-0.5', className)}>
      {opts.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active
                ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.08)] dark:bg-secondary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Meter({
  value,
  tone = 'neutral',
  className,
  label,
}: {
  value: number
  tone?: Tone | 'ink'
  className?: string
  label?: string
}) {
  const map: Record<Tone | 'ink', string> = {
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
    neutral: 'bg-muted-foreground/60',
    ai: 'bg-ai',
    ink: 'bg-primary',
  }
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', map[tone])} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}
