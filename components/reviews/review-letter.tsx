'use client'

import { useState, useTransition } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Check, Copy, Loader2, RotateCcw, Save, Sparkles, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saveReviewLetter } from '@/app/actions/workspace'

function formatSaved(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ReviewLetter({
  clientSlug,
  clientName,
  initialDraft,
  initialSavedAt,
  locked,
}: {
  clientSlug: string
  clientName: string
  initialDraft: string | null
  initialSavedAt: string | null
  locked: boolean
}) {
  const [draft, setDraft] = useState(initialDraft ?? '')
  const [savedDraft, setSavedDraft] = useState(initialDraft ?? '')
  const [savedAt, setSavedAt] = useState(initialSavedAt)
  const [saving, startSaving] = useTransition()
  const [saveError, setSaveError] = useState(false)
  const [copied, setCopied] = useState(false)

  const { completion, complete, isLoading, stop, error } = useCompletion({
    api: `/api/reviews/${clientSlug}/letter`,
    onFinish: (_prompt, text) => {
      const finalText = text.trim()
      setDraft(finalText)
      setSavedDraft(finalText)
      setSavedAt(new Date().toISOString())
    },
  })

  const text = isLoading ? completion : draft
  const hasDraft = text.trim().length > 0
  const dirty = !isLoading && draft !== savedDraft
  const needsRecommendation = draft.includes('[ADVISER RECOMMENDATION')

  function generate() {
    if (dirty && !window.confirm('Replace your unsaved edits with a new draft?')) return
    setSaveError(false)
    complete('draft')
  }

  function save() {
    setSaveError(false)
    startSaving(async () => {
      try {
        const at = await saveReviewLetter(clientSlug, draft)
        setSavedDraft(draft.trim())
        setSavedAt(at)
      } catch (err) {
        console.error('[letter] save failed', err)
        setSaveError(true)
      }
    })
  }

  async function copy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section id="letter" aria-labelledby="letter-h" className="scroll-mt-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="letter-h" className="text-sm font-semibold">
            Draft review letter
          </h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {isLoading
              ? 'Drafting from client data…'
              : dirty
                ? 'Unsaved changes'
                : savedAt
                  ? `Saved ${formatSaved(savedAt)}`
                  : 'Not drafted yet'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            <Button size="sm" variant="outline" onClick={stop}>
              <Square aria-hidden /> Stop
            </Button>
          ) : (
            <Button size="sm" variant={hasDraft ? 'outline' : 'default'} onClick={generate} disabled={locked}>
              {hasDraft ? <RotateCcw aria-hidden /> : <Sparkles aria-hidden />}
              {hasDraft ? 'Redraft' : 'Draft with AI'}
            </Button>
          )}
          {hasDraft && !isLoading && (
            <>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? <Check aria-hidden className="text-positive" /> : <Copy aria-hidden />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" onClick={save} disabled={!dirty || saving || locked}>
                {saving ? <Loader2 aria-hidden className="animate-spin" /> : <Save aria-hidden />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {hasDraft ? (
        <>
          <label htmlFor="letter-text" className="sr-only">
            Review letter for {clientName}
          </label>
          <textarea
            id="letter-text"
            value={text}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={isLoading || locked}
            rows={18}
            className="mt-4 w-full resize-y rounded-lg border bg-background p-4 font-serif text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">Draft {clientName}&apos;s letter from their record</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            AdviserOS writes the letter from the review data. You edit it and add your recommendation before it&apos;s
            sent.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          Couldn&apos;t draft the letter. Try again.
        </p>
      )}
      {saveError && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          Couldn&apos;t save your edits. Try again.
        </p>
      )}
      {hasDraft && !isLoading && needsRecommendation && (
        <p className="mt-3 rounded-md bg-warning-soft px-3 py-2 text-sm text-accent-foreground">
          Replace the [ADVISER RECOMMENDATION] line with your advice before sending. AdviserOS does not draft advice.
        </p>
      )}
    </section>
  )
}
