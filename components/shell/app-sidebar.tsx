'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { resetDemoData } from '@/app/actions/demo'
import { isDemoEmail } from '@/lib/demo-account'
import {
  RotateCcw,
  LogOut,
  Bell,
  CalendarCheck,
  Database,
  FileText,
  House,
  ListChecks,
  Plug,
  Settings,
  Users,
  type LucideIcon,
  History,
} from 'lucide-react'
import { LogoMark } from '@/components/brand/logo-mark'
import { cn } from '@/lib/utils'
import { ADVISER } from '@/lib/data'
import { authClient } from '@/lib/auth-client'

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function DemoReset() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleReset() {
    setError(null)
    startTransition(async () => {
      try {
        await resetDemoData()
        await mutate(() => true)
        setConfirming(false)
        router.refresh()
      } catch {
        setError('Reset failed. Please try again.')
      }
    })
  }

  if (!confirming) {
    return (
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Reset demo data
        </button>
      </div>
    )
  }

  return (
    <div role="alertdialog" aria-labelledby="demo-reset-title" className="px-3 pt-3">
      <div className="rounded-md border border-sidebar-border bg-sidebar-accent/60 p-3">
        <p id="demo-reset-title" className="text-xs font-medium text-sidebar-accent-foreground">
          Reset the demo for everyone?
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/80">
          Restores the sample clients and clears letters, chats and activity for anyone using this login.
        </p>
        {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={pending}
            className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? 'Resetting…' : 'Reset'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="flex-1 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function UserFooter() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const name = session?.user.name || session?.user.email || ''
  const isDemo = isDemoEmail(session?.user.email)

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <>
    {isDemo && <DemoReset />}
    <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
        {name ? initialsOf(name) : ''}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm text-sidebar-accent-foreground">{name || '\u00a0'}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/70">{ADVISER.firm}</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="rounded-md p-1.5 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut aria-hidden className="size-4" />
      </button>
    </div>
    </>
  )
}

const primary: { href: string; label: string; icon: LucideIcon; count?: number }[] = [
  { href: '/', label: 'Home', icon: House },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/reviews', label: 'Reviews', icon: CalendarCheck, count: 15 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, count: 5 },
  { href: '/alerts', label: 'Alerts', icon: Bell, count: 6 },
  { href: '/activity', label: 'Activity', icon: History },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/data-sources', label: 'Data Sources', icon: Database },
]

const secondary = [
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavLink({
  href,
  label,
  icon: Icon,
  count,
  onNavigate,
}: {
  href: string
  label: string
  icon: LucideIcon
  count?: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-tour={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon aria-hidden className={cn('size-4', active && 'text-sidebar-primary')} />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="rounded bg-sidebar-border px-1.5 text-[11px] tabular-nums text-sidebar-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

export function AppSidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return (
    <>
      <div
        aria-hidden
        onClick={onNavigate}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/30 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:z-auto lg:w-60 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <LogoMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-accent-foreground">AdviserOS</p>
            <p className="text-[11px] text-sidebar-foreground/70">AI workspace for financial advisers</p>
          </div>
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-0.5 px-2 py-2">
          {primary.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </nav>
        <nav aria-label="Workspace" className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
          {secondary.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </nav>
        <UserFooter />
      </aside>
    </>
  )
}
