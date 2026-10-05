'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Analysis } from '@/lib/personal/analysis'
import { formatGBP } from '@/lib/personal/format'
import { AiMark, Dot, Panel, PanelHeader, Pill } from '@/components/personal/wealth/primitives'
import { AskAiButton } from '@/components/personal/shell/ask-ai-button'
import { cn } from '@/lib/utils'

const fitTone = { High: 'positive', Medium: 'neutral', Low: 'warning' } as const
const presets = [5_000, 10_000, 20_000, 50_000]

export function InvestmentAnalysis({ a }: { a: Analysis }) {
  const [amount, setAmount] = useState(a.defaultAmount)
  const scale = amount / 10_000
  const concIdx = amount < 10_000 ? 0 : amount < 30_000 ? 1 : 2

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/me/opportunities" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />Opportunities
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted font-mono text-[11px] font-semibold">{a.ticker.slice(0, 4)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
                <Pill>{a.kind}</Pill>
              </div>
              <p className="font-mono text-[12px] text-muted-foreground">{a.ticker} · {a.price}</p>
            </div>
          </div>
          <AskAiButton question={`Should I buy more ${a.ticker}? Analyse my portfolio against my goals.`}>Discuss with AI</AskAiButton>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground text-pretty">{a.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {a.metrics.map((m) => (
          <Panel key={m.label} className="p-4">
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Dot tone={m.tone} />{m.label}</p>
            <p className="num mt-1 text-[15px] font-semibold tracking-tight">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.note}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="p-5 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">What changes if you buy this?</h2>
              <p className="text-[13px] text-muted-foreground">Modelled across all 9 accounts and 5 goals.</p>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Investment amount">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={amount === p}
                  onClick={() => setAmount(p)}
                  className={cn('num h-7 rounded-md border px-2.5 text-[12px]', amount === p ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted')}
                >
                  {formatGBP(p)}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-[13px] text-muted-foreground">
            Investment: <span className="num font-semibold text-foreground">{formatGBP(amount)} {a.name}</span>
          </p>

          <ul className="mt-3 divide-y rounded-xl border">
            {a.impacts.map((i) => {
              const after = i.before + i.perTenK * scale
              const diff = after - i.before
              const good = i.better === 'lower' ? diff < 0 : diff > 0
              const digits = i.before % 1 ? 1 : Math.abs(diff) < 1 ? 1 : 0
              return (
                <li key={i.label} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <span>{i.label}</span>
                  <span className="num flex items-center gap-2">
                    <span className="text-muted-foreground">{i.before.toFixed(i.before % 1 ? 1 : 0)}%</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                    <span className={cn('w-12 text-right font-semibold', Math.abs(diff) < 0.05 ? '' : good ? 'text-positive' : 'text-warning')}>
                      {after.toFixed(digits)}%
                    </span>
                  </span>
                </li>
              )
            })}
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
              <span>Concentration risk</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{a.concentration[0]}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                <span className={cn('font-semibold', a.concentration[concIdx] !== a.concentration[0] && /High/.test(a.concentration[concIdx]) ? 'text-negative' : '')}>
                  {a.concentration[concIdx]}
                </span>
              </span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">Estimates based on current holdings and 3-year covariance. Not a forecast of returns.</p>
        </Panel>

        <Panel className="flex flex-col lg:col-span-2">
          <PanelHeader
            title="Portfolio fit"
            icon={<AiMark size="sm" />}
            action={<Pill tone={fitTone[a.fit.verdict]}>{a.fit.verdict}</Pill>}
          />
          <dl className="mt-4 grid grid-cols-2 gap-3 px-5 text-[12px]">
            <div className="rounded-xl bg-muted/60 p-3"><dt className="text-muted-foreground">Existing exposure</dt><dd className="mt-0.5 font-medium">{a.fit.existing}</dd></div>
            <div className="rounded-xl bg-muted/60 p-3"><dt className="text-muted-foreground">Goal relevance</dt><dd className="mt-0.5 font-medium">{a.fit.goal}</dd></div>
          </dl>
          <ul className="flex flex-col gap-2.5 p-5 text-[13px] leading-relaxed">
            {a.fit.notes.map((n) => (
              <li key={n} className="flex gap-2.5 text-pretty"><span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden />{n}</li>
            ))}
          </ul>
          <p className="mt-auto border-t px-5 py-3 text-[11px] text-muted-foreground">Analysis of fit, not a buy or sell recommendation.</p>
        </Panel>
      </div>
    </div>
  )
}
