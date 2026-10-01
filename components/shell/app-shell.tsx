'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Compass, Menu, Sparkles } from 'lucide-react'
import { TourProvider, useTour } from '@/components/tour/product-tour'
import { Button } from '@/components/ui/button'
import { AdviserPanel } from '@/components/adviser/adviser-panel'
import { useAdviser } from '@/components/adviser/adviser-provider'
import { AppSidebar } from './app-sidebar'
import { CommandBar } from './command-bar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/ack/')) return <>{children}</>

  return (
    <TourProvider>
      <Shell>{children}</Shell>
    </TourProvider>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const { setPanelOpen } = useAdviser()
  const { start } = useTour()

  return (
    <div className="flex h-dvh overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="contents print:hidden">
        <AppSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6 print:hidden">
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
          <Button variant="ghost" className="ml-auto" onClick={start} data-tour="tour-button">
            <Compass aria-hidden />
            <span className="hidden sm:inline">Tour</span>
          </Button>
          <Button variant="outline" className="xl:hidden" onClick={() => setPanelOpen(true)}>
            <Sparkles aria-hidden className="text-brass" />
            <span className="hidden sm:inline">AdviserOS</span>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto print:overflow-visible">{children}</main>
      </div>
      <div className="contents print:hidden">
        <AdviserPanel />
      </div>
    </div>
  )
}
