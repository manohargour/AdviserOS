'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Goal,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  PieChart,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { accounts } from '@/lib/personal/data'
import { signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

export const navItems = [
  { href: '/me', label: 'Overview', icon: LayoutDashboard },
  { href: '/me/goals', label: 'Goals', icon: Goal },
  { href: '/me/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/me/advisor', label: 'AI Advisor', icon: Sparkles },
  { href: '/me/opportunities', label: 'Opportunities', icon: Compass },
  { href: '/me/insights', label: 'Insights', icon: Lightbulb, badge: 3 },
  { href: '/me/accounts', label: 'Accounts', icon: Landmark },
  { href: '/me/adviser', label: 'My adviser', icon: UserRoundCheck, clientOnly: true },
]

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Logo() {
  return (
    <Link href="/me" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <span className="relative flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 4v16M4 12c3-2 13-2 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Meridian</span>
    </Link>
  )
}

export function SidebarNav({
  onNavigate,
  user,
}: {
  onNavigate?: () => void
  user: { name: string; email: string; role: 'personal' | 'client' }
}) {
  const isClient = user.role === 'client'
  const items = navItems.filter((item) => !item.clientOnly || isClient)
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    router.push('/sign-in?as=personal')
    router.refresh()
  }
  const connected = accounts.filter((a) => a.status === 'Connected').length

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {items.map(({ href, label, icon: Icon, badge }) => {
            const active = href === '/me' ? pathname === '/me' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-sidebar-border'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon
                    className={cn('size-4', active ? (href === '/me/advisor' ? 'text-ai' : 'text-foreground') : 'text-muted-foreground')}
                    aria-hidden
                  />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="num rounded-full bg-ai-soft px-1.5 text-[10px] font-semibold text-ai-foreground">{badge}</span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
        {!isClient && (
          <Link
            href="/me/adviser"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <UserRoundCheck className="size-3.5" aria-hidden />
            Work with an adviser? Connect
          </Link>
        )}
        <Link
          href="/me/accounts"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-positive/40" />
              <span className="relative size-2 rounded-full bg-positive" />
            </span>
            Connected accounts
          </span>
          <span className="num font-medium text-foreground">
            {connected}/{accounts.length}
          </span>
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {initialsOf(user.name) || '?'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {isClient ? 'Adviser client' : 'Independent'} · {user.email}
            </span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground disabled:opacity-50"
            aria-label="Sign out"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
