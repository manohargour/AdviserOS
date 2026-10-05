'use client'

import { Sparkles } from 'lucide-react'
import { useAiPanel } from './app-shell'
import { cn } from '@/lib/utils'

export function AskAiButton({
  question,
  children,
  variant = 'soft',
  className,
}: {
  question: string
  children?: React.ReactNode
  variant?: 'soft' | 'ghost' | 'solid'
  className?: string
}) {
  const { ask } = useAiPanel()
  return (
    <button
      type="button"
      onClick={() => ask(question)}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        variant === 'soft' && 'bg-ai-soft text-ai-foreground hover:bg-ai/15',
        variant === 'ghost' && 'text-ai-foreground hover:bg-ai-soft',
        variant === 'solid' && 'bg-ai text-white hover:bg-ai/90',
        className,
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {children ?? 'Ask AI'}
    </button>
  )
}
