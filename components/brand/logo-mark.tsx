import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-serif text-lg font-semibold leading-none text-sidebar-primary-foreground',
        className,
      )}
    >
      A
      <span className="absolute right-1 top-1 size-1.5 rounded-full bg-sidebar-primary-foreground/70" />
    </span>
  )
}
