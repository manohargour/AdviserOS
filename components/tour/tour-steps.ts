export type TourStep = {
  title: string
  body: string
  target?: string
  route?: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to AdviserOS',
    body: 'A quick tour of how AdviserOS prepares client work, so you can spend your time on advice and judgement.',
    route: '/',
  },
  {
    title: 'Today at a glance',
    body: 'Reviews due, open tasks, alerts and clients needing attention, calculated live from your client book.',
    target: '[data-tour="stats"]',
    route: '/',
  },
  {
    title: 'AdviserOS suggests what to do next',
    body: 'The workspace spots what needs your attention, such as risk profile changes, overdue reviews and missing documents, and suggests the next action.',
    target: '[data-tour="suggestions"]',
    route: '/',
  },
  {
    title: 'Ask or instruct in plain English',
    body: 'Type a request like "Prepare me for Sarah\'s meeting" or press ⌘K from anywhere. AdviserOS does the groundwork.',
    target: '[data-tour="command-bar"]',
  },
  {
    title: 'An AI assistant that knows your clients',
    body: 'It answers from your real client data, can create tasks for you, and saves every conversation to History.',
    target: '[data-tour="adviser-panel"]',
  },
  {
    title: 'Review preparation, done for you',
    body: 'Every review opens with changes since the last meeting, allocation drift and outstanding items already pulled together.',
    target: '#outstanding',
    route: '/reviews/john-smith',
  },
  {
    title: 'Draft review letters with AI',
    body: 'Create a first draft of the client letter in one click. Edit it, save it, and the adviser keeps the final say.',
    target: '#letter',
    route: '/reviews/john-smith',
  },
  {
    title: 'A full audit trail',
    body: 'Every task, letter and AI action is logged in Activity, ready for compliance and file reviews.',
    target: '[data-tour="nav-activity"]',
  },
  {
    title: 'Replay any time',
    body: 'Use the Tour button to run this walkthrough again. Enjoy exploring AdviserOS.',
    target: '[data-tour="tour-button"]',
  },
]
