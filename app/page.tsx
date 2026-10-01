import { PageContainer } from '@/components/shell/page-header'
import { StatCards } from '@/components/home/stat-cards'
import { CopilotSuggestions } from '@/components/home/copilot-suggestions'
import { TodaySchedule } from '@/components/home/today-schedule'
import { ProductConcept } from '@/components/home/product-concept'
import { ADVISER, TODAY_LABEL } from '@/lib/data'

export default function HomePage() {
  return (
    <PageContainer>
      <section aria-labelledby="greeting">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{TODAY_LABEL}</p>
        <h1 id="greeting" className="mt-1 font-serif text-4xl font-medium tracking-tight">
          Good morning, {ADVISER.firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s where your attention is needed today.</p>
      </section>
      <StatCards />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CopilotSuggestions />
        </div>
        <TodaySchedule />
      </div>
      <ProductConcept />
    </PageContainer>
  )
}
