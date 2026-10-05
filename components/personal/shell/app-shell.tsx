'use client'

import { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Menu, Search, Sparkles, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/personal/ui/sheet'
import { AdvisorChat } from '@/components/personal/advisor/advisor-chat'
import { AiMark } from '@/components/personal/wealth/primitives'
import { Logo, SidebarNav } from './sidebar-nav'
import { cn } from '@/lib/utils'

type AiPanelContext = { open: boolean; setOpen: (v: boolean) => void; ask: (q: string) => void; question?: string; askKey: number }
const AiPanelCtx = createContext<AiPanelContext | null>(null)

export function useAiPanel() {
  const ctx = useContext(AiPanelCtx)
  if (!ctx) throw new Error('useAiPanel must be used within AppShell')
  return ctx
}

export type ShellUser = { name: string; email: string; role: 'personal' | 'client' }

export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const pathname = usePathname()
  const [mobileNav, setMobileNav] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [question, setQuestion] = useState<string>()
  const [askKey, setAskKey] = useState(0)
  const onAdvisor = pathname.startsWith('/me/advisor')
  const panelVisible = aiOpen && !onAdvisor

  const ask = (q: string) => {
    setQuestion(q)
    setAskKey((k) => k + 1)
    setAiOpen(true)
  }

  return (
    <AiPanelCtx.Provider value={{ open: aiOpen, setOpen: setAiOpen, ask, question, askKey }}>
      <div className="flex min-h-dvh bg-background">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
          <SidebarNav user={user} />
        </aside>

        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav user={user} onNavigate={() => setMobileNav(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:px-8">
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <label htmlFor="global-search" className="sr-only">
                Search holdings, goals and accounts
              </label>
              <input
                id="global-search"
                placeholder="Search holdings, goals, accounts…"
                className="h-9 w-full rounded-lg border bg-card pr-12 pl-9 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring/50 focus:ring-3 focus:ring-ring/15"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications, 3 unread"
              >
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-ai" aria-hidden />
              </button>
              {!onAdvisor ? (
                <button
                  type="button"
                  onClick={() => setAiOpen(!aiOpen)}
                  aria-pressed={aiOpen}
                  className={cn(
                    'ml-1 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors',
                    aiOpen ? 'border-ai/30 bg-ai-soft text-ai-foreground' : 'bg-card hover:bg-muted',
                  )}
                >
                  <Sparkles className="size-4 text-ai" aria-hidden />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              ) : null}
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            </main>

            {panelVisible ? (
              <aside
                aria-label="AI assistant"
                className="fixed inset-0 top-16 z-40 flex flex-col border-l bg-card xl:sticky xl:top-16 xl:z-auto xl:h-[calc(100dvh-4rem)] xl:w-[400px] xl:shrink-0"
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                  <div className="flex items-center gap-2.5">
                    <AiMark size="sm" />
                    <div>
                      <p className="text-[13px] font-semibold">Wealth copilot</p>
                      <p className="text-[11px] text-muted-foreground">Grounded in your live portfolio</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiOpen(false)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label="Close AI assistant"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <AdvisorChat key={askKey} compact initialQuestion={question} />
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </AiPanelCtx.Provider>
  )
}
