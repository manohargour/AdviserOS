import type { Metadata } from 'next'
import { AdvisorChat } from '@/components/personal/advisor/advisor-chat'
import { AdvisorContext } from '@/components/personal/advisor/advisor-context'
import { ScenarioSimulator } from '@/components/personal/advisor/scenario-simulator'
import { PageHeader, Panel } from '@/components/personal/wealth/primitives'
import { requirePersonal } from '@/lib/roles'
import { getPersonalSnapshot } from '@/lib/personal/store'

export const metadata: Metadata = { title: 'AI Advisor' }

export default async function AdvisorPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const user = await requirePersonal()
  const snapshot = await getPersonalSnapshot(user)
  const input = {
    netWorth: snapshot.netWorth,
    portfolio: snapshot.portfolio,
    holdings: snapshot.holdings,
    allocation: snapshot.allocation,
    goals: snapshot.goals,
    profile: snapshot.profile,
  }
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="AI Advisor"
        title="Ask your wealth"
        description="An analytical copilot grounded in your accounts, goals and exposures. It separates facts from assumptions — and never predicts the market."
      />
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-[12px] text-muted-foreground">
        Guidance here is general information, not regulated financial advice. Projections are estimates based on your inputs, not guarantees. Consider speaking to a regulated adviser before making decisions.
      </p>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel className="flex h-[min(680px,calc(100dvh-14rem))] min-h-[480px] flex-col p-4 md:p-5">
          <AdvisorChat
            initialQuestion={q}
            data={input}
            counts={{ accounts: snapshot.accounts.length, goals: snapshot.goals.length, holdings: snapshot.holdings.length }}
          />
        </Panel>
        <AdvisorContext
          netWorth={snapshot.netWorth}
          goals={snapshot.goals}
          profile={snapshot.profile}
          exposures={snapshot.allocation.asset.slice(0, 4)}
        />
      </div>
      <ScenarioSimulator holdings={snapshot.holdings} netWorth={snapshot.netWorth} />
    </div>
  )
}
