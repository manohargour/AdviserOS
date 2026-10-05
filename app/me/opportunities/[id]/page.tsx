import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAnalysis } from '@/lib/personal/analysis'
import { InvestmentAnalysis } from '@/components/personal/opportunities/investment-analysis'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const a = getAnalysis(id)
  return { title: a ? `${a.name} analysis` : 'Analysis' }
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = getAnalysis(id)
  if (!a) notFound()
  return <InvestmentAnalysis a={a} />
}
