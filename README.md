# AdviserOS

An AI copilot for UK financial advisers, with a built-in personal-wealth experience ("Meridian") for their clients and independent users. It brings client data, portfolios, risk information and documents together, prepares the work, surfaces what needs attention, and leaves every judgement with a regulated human.

The repository is a single [Next.js](https://nextjs.org) 16 (App Router) application that serves two experiences from one codebase:

| Experience | Route | Audience | Brand |
| --- | --- | --- | --- |
| Adviser workspace | `/` | Financial advisers running client reviews | AdviserOS |
| Personal wealth | `/me` | Independent (B2C) users and adviser clients | Meridian |

## Roles

A user picks a role once at sign-up ([lib/roles.ts](lib/roles.ts)); it cannot be changed by a later profile update.

- **adviser** — runs client reviews in the AdviserOS workspace.
- **personal** — an independent user managing their own wealth, with no adviser.
- **client** — a personal user who is served by an adviser and receives their reports. A `personal` user automatically becomes a `client` when they link an adviser's report.

## Features

### Adviser workspace (`/`)
- Client book, reviews, tasks, alerts, documents and data sources.
- A persistent **AdviserOS copilot** panel that is grounded in real client data via tools (never invents figures) and always leaves decisions to the adviser.
- Annual review → report → email → client acknowledgement flow, with an audit activity log and idempotent email sending.
- AI-drafted review letters with a mandatory adviser-recommendation placeholder.

### Personal wealth — Meridian (`/me`)
Per-user, persisted and fully editable — nothing is shared, everything is computed from the user's own data.

- **Accounts** — add, edit and delete investment accounts, property, cash and liabilities; these drive net worth.
- **Holdings** — add and delete positions; these drive the portfolio, allocation and exposure views.
- **Goals** — create, track and delete goals with monthly-compounded projections and a success probability.
- **Overview** — net worth with history, allocation by asset class / region / currency / account, and a computed portfolio-health score.
- **Insights, Opportunities and an AI advisor** — all derived from the user's real figures (concentration, cash buffer, tax wrappers, goal funding, currency mix) with clear disclaimers. The advisor is informational and never gives regulated advice.
- **Scenario simulator** — applies market shocks to the user's actual holdings to estimate the impact on net worth.
- New accounts start empty, with a one-click **Load sample data** option for demos.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript (strict)
- **Database:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) and `pg`
- **Auth:** [better-auth](https://www.better-auth.com) (email + password)
- **AI:** [AI SDK](https://ai-sdk.dev) v7 through an AI Gateway (model configurable)
- **Email:** [Resend](https://resend.com)
- **PDF:** `@react-pdf/renderer`
- **UI:** Tailwind CSS v4, shadcn-style components, Recharts
- **Testing:** [Vitest](https://vitest.dev)
- **Package manager:** pnpm

## Getting started

### Prerequisites
- Node.js 20+ and pnpm
- A PostgreSQL database

### Install

```bash
pnpm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
# Database (required)
DATABASE_URL="postgres://user:password@host:5432/dbname"

# Auth (required). Generate a long random secret.
BETTER_AUTH_SECRET="a-long-random-secret-at-least-32-chars"
# Optional in local dev; set in production to your canonical URL.
BETTER_AUTH_URL="https://your-app.example.com"

# AI (required for the copilot/letter features). Configure your AI Gateway
# credentials per the AI SDK provider you use. Model is overridable:
AI_MODEL="anthropic/claude-sonnet-4"

# Email (optional — report sending is disabled until set)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Your Firm <reports@yourdomain.com>"

# Demo reset cron (optional)
CRON_SECRET="another-random-secret"
```

### Database schema

The schema lives in [lib/db/schema.ts](lib/db/schema.ts). Provision all tables in one step:

```bash
pnpm db:setup
```

This runs an idempotent script ([db/setup.sql](db/setup.sql)) that creates every table with `CREATE TABLE IF NOT EXISTS`. It is safe to run against a brand-new database (creates everything, including the better-auth tables) or an existing one (nothing is altered or dropped and no data is touched). Run it once per environment before first use — and again after any schema change — including on the production database.

It reads `DATABASE_URL` from the environment or from `.env.local`.

For iterating on the schema during development you can also use Drizzle Kit:

```bash
pnpm db:push     # sync lib/db/schema.ts to the database (app tables only)
pnpm db:studio   # browse the database
```

As a safety net, the personal (`personal_*`) tables are also created on first use at runtime by `ensurePersonalTables()` in [lib/personal/store.ts](lib/personal/store.ts), but `pnpm db:setup` is the canonical, complete step.

### Run

```bash
pnpm dev       # start the dev server (http://localhost:3000)
pnpm build     # production build (type-checked)
pnpm start     # run the production build
pnpm test      # run the Vitest unit tests
pnpm db:setup  # create the database tables (idempotent)
```

## Testing

Unit tests live in [tests/](tests/) and cover the pure, security- and money-sensitive logic: goal projections, per-user insights/opportunities/scenario derivations, the rate limiter, and report/acknowledgement status rules.

```bash
pnpm test
```

## Project structure

```
app/            # App Router routes
  (adviser)     # /, /clients, /reviews, /reports, /tasks, /alerts, ...
  me/           # /me — the personal (Meridian) experience
  actions/      # server actions (reports, workspace, personal-data, ...)
  api/          # route handlers (adviser chat, letters, report PDF, cron)
components/      # UI, grouped by feature (adviser, personal, reports, ...)
lib/
  db/           # Drizzle client and schema
  personal/     # per-user store, pure derivations (projection, insights)
  ai.ts         # central AI model config
  rate-limit.ts # fixed-window limiter for AI endpoints
  auth.ts, roles.ts, workspace.ts, email.ts, ...
tests/          # Vitest unit tests
```

## Security & compliance notes

- All data access is scoped by `userId`; the adviser and personal data stores are isolated per user.
- The streaming AI endpoints are rate-limited per user ([lib/rate-limit.ts](lib/rate-limit.ts)). The default limiter is in-memory (per instance); back it with a shared store for multi-instance deployments.
- Report acknowledgement links are single-purpose tokens that expire after 30 days.
- The adviser copilot and the personal advisor both prepare information and surface options; neither presents regulated financial advice.

## Deployment

The app is designed for Vercel.

1. Configure the environment variables above (database, auth, AI, and optionally email/cron).
2. Provision the database once with `pnpm db:setup` (run against the production `DATABASE_URL`).
3. Deploy. The demo-reset cron in [vercel.json](vercel.json) runs if a `CRON_SECRET` is set.
