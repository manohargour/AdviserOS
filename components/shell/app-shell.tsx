'use client'

import { useState } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdviserPanel } from '@/components/adviser/adviser-panel'
import { useAdviser } from '@/components/adviser/adviser-provider'
import { AppSidebar } from './app-sidebar'
import { CommandBar } from './command-bar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const { setPanelOpen } = useAdviser()

  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <CommandBar />
          <Button variant="outline" className="ml-auto xl:hidden" onClick={() => setPanelOpen(true)}>
            <Sparkles aria-hidden className="text-brass" />
            <span className="hidden sm:inline">AdviserOS</span>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <AdviserPanel />
    </div>
  )
}
