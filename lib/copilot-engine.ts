import { findClientInText, getClient, type Client } from './data'

export type ResponseKind =
  | 'review-prepared'
  | 'changes'
  | 'equity-source'
  | 'risk-source'
  | 'equity-explain'
  | 'attention'
  | 'letter'
  | 'missing'
  | 'summary'
  | 'brief'
  | 'reviews-week'
  | 'clients-attention'
  | 'risk-changes'
  | 'fallback'

export type CopilotPlan = {
  kind: ResponseKind
  clientId?: string
  steps: string[]
}

const DEFAULT_CLIENT_ID = 'john-smith'

export function planFor(prompt: string, contextClientId?: string): CopilotPlan {
  const text = prompt.toLowerCase()
  const mentioned = findClientInText(prompt)
  const client: Client | undefined = mentioned ?? (contextClientId ? getClient(contextClientId) : undefined)
  const clientId = client?.id
  const name = client?.firstName ?? 'the client'
  const has = (...words: string[]) => words.some((w) => text.includes(w))

  if (has('all reviews', 'reviews due this week', 'reviews this week')) {
    return {
      kind: 'reviews-week',
      steps: ['Scanned review calendar', 'Found 6 reviews due in the next 7 days', 'Loaded client data from Xplan', 'Drafted 4 reviews'],
    }
  }
  if (has('changed risk', 'risk profiles')) {
    return {
      kind: 'risk-changes',
      steps: ['Queried Dynamic Planner and FinaMetrica', 'Compared against previous profiles'],
    }
  }
  if (has('clients requiring', 'clients need', 'which clients', 'show clients')) {
    return { kind: 'clients-attention', steps: ['Checked alerts across 412 clients', 'Ranked by urgency'] }
  }
  if (has('brief', 'prepare me for', 'before my meeting') && !has('summar')) {
    const target = clientId ?? 'sarah-williams'
    const c = getClient(target)!
    return {
      kind: 'brief',
      clientId: target,
      steps: [
        `Loaded ${c.firstName}'s Xplan record`,
        'Retrieved current portfolio',
        'Read previous adviser notes',
        'Checked outstanding actions',
        'Compiled client brief',
      ],
    }
  }
  if (has('prepare', 'draft') && has('review') && !has('letter')) {
    return {
      kind: 'review-prepared',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: [
        'Loaded Xplan client information',
        'Retrieved portfolio data',
        'Loaded risk assessment',
        'Compared previous review',
        `Identified ${(client ?? getClient(DEFAULT_CLIENT_ID)!).changes.length} changes`,
        'Drafted annual review',
      ],
    }
  }
  if (has('where did', '69', 'come from') && has('equity', '69')) {
    return {
      kind: 'equity-source',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Located latest portfolio export', 'Recalculated equity allocation'],
    }
  }
  if (has('source') && has('risk')) {
    return {
      kind: 'risk-source',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Retrieved risk questionnaire', 'Matched score to risk model'],
    }
  }
  if (has('explain') && has('equity', 'allocation')) {
    return {
      kind: 'equity-explain',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Compared holdings against last review', 'Checked transaction history', 'Attributed change by fund'],
    }
  }
  if (has('what changed', 'changed since', 'changes since', 'what has changed')) {
    return {
      kind: 'changes',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Loaded previous review (Oct 2025)', 'Retrieved current data from 4 sources', 'Compared 42 data points'],
    }
  }
  if (has('attention')) {
    return {
      kind: 'attention',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Checked review draft', 'Checked alerts and compliance rules'],
    }
  }
  if (has('letter', 'draft')) {
    return {
      kind: 'letter',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Loaded review findings', 'Applied firm letter template', 'Drafted review letter'],
    }
  }
  if (has('missing')) {
    return {
      kind: 'missing',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: ['Checked fact-find completeness', 'Checked document requirements'],
    }
  }
  if (has('summar')) {
    return {
      kind: 'summary',
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      steps: [`Loaded ${name === 'the client' ? 'client' : name + "'s"} record`, 'Summarised recent activity'],
    }
  }
  return { kind: 'fallback', clientId, steps: [] }
}

export function suggestedPromptsFor(client?: Client) {
  if (!client) {
    return [
      'Prepare all reviews due this week',
      'Show clients requiring adviser attention',
      "Draft John's annual review",
      'Which clients have changed risk profiles?',
      "Prepare me for Sarah's meeting",
    ]
  }
  if (client.id === 'john-smith') {
    return [
      "Prepare John's annual review",
      'What changed since his last review?',
      'What requires my attention?',
      'Draft the review letter',
      'Explain the equity allocation change',
      'Show the source of his risk score',
      'What information is missing?',
      'Summarise John before my meeting',
    ]
  }
  const n = client.firstName
  return [
    `Prepare ${n}'s client brief`,
    `What changed since ${n}'s last review?`,
    'What requires my attention?',
    `Prepare ${n}'s annual review`,
    'What information is missing?',
    `Summarise ${n} before my meeting`,
  ]
}
