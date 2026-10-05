import type { Metadata } from 'next'
import { AdvisorChat } from '@/components/personal/advisor/advisor-chat'
import { AdvisorContext } from '@/components/personal/advisor/advisor-context'
import { ScenarioSimulator } from '@/components/personal/advisor/scenario-simulator'
import { PageHeader, Panel } from '@/components/personal/wealth/primitives'

export const metadata: Metadata = { title: 'AI Advisor' }

export default async function AdvisorPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="AI Advisor"
        title="Ask your wealth"
        description="An analytical copilot grounded in your accounts, goals and exposures. It separates facts from assumptions — and never predicts the market."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel className="flex h-[min(680px,calc(100dvh-14rem))] min-h-[480px] flex-col p-4 md:p-5">
          <AdvisorChat initialQuestion={q} />
        </Panel>
        <AdvisorContext />
      </div>
      <ScenarioSimulator />
    </div>
  )
}
