import 'server-only'

import { and, asc, eq, sql } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import {
  personalAccounts,
  personalGoals,
  personalHoldings,
  personalProfile,
} from '@/lib/db/schema'
import type { AllocationSlice, Goal, Holding, Period } from '@/lib/personal/data'
import { deriveGoalStatus } from '@/lib/personal/projection'
import {
  accounts as SAMPLE_ACCOUNTS,
  goals as SAMPLE_GOALS,
  holdings as SAMPLE_HOLDINGS,
  user as SAMPLE_USER,
} from '@/lib/personal/data'

/* ------------------------------------------------------------------ */
/* Runtime table creation (the repo ships no migration tooling)        */
/* ------------------------------------------------------------------ */

let ensured: Promise<void> | null = null

export function ensurePersonalTables() {
  if (!ensured) {
    ensured = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS personal_profile (
          "userId" text PRIMARY KEY,
          "riskProfile" text NOT NULL DEFAULT 'Balanced',
          "riskScore" integer NOT NULL DEFAULT 5,
          "age" integer,
          "baseCurrency" text NOT NULL DEFAULT 'GBP',
          "monthlySpending" integer NOT NULL DEFAULT 0,
          "seeded" boolean NOT NULL DEFAULT false,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS personal_accounts (
          "id" serial PRIMARY KEY,
          "userId" text NOT NULL,
          "name" text NOT NULL,
          "type" text NOT NULL DEFAULT '',
          "kind" text NOT NULL DEFAULT 'investment',
          "value" integer NOT NULL DEFAULT 0,
          "region" text NOT NULL DEFAULT 'UK',
          "status" text NOT NULL DEFAULT 'Manual',
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS personal_accounts_userId_idx ON personal_accounts ("userId");
        CREATE TABLE IF NOT EXISTS personal_holdings (
          "id" serial PRIMARY KEY,
          "userId" text NOT NULL,
          "accountId" integer,
          "name" text NOT NULL,
          "ticker" text NOT NULL DEFAULT '',
          "value" integer NOT NULL DEFAULT 0,
          "returnPct" double precision NOT NULL DEFAULT 0,
          "dayPct" double precision NOT NULL DEFAULT 0,
          "assetClass" text NOT NULL DEFAULT 'Equity',
          "accountLabel" text NOT NULL DEFAULT 'GIA',
          "sector" text NOT NULL DEFAULT 'Diversified',
          "region" text NOT NULL DEFAULT 'Global',
          "currency" text NOT NULL DEFAULT 'GBP',
          "goal" text NOT NULL DEFAULT '',
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS personal_holdings_userId_idx ON personal_holdings ("userId");
        CREATE TABLE IF NOT EXISTS personal_goals (
          "id" serial PRIMARY KEY,
          "userId" text NOT NULL,
          "slug" text NOT NULL,
          "name" text NOT NULL,
          "description" text NOT NULL DEFAULT '',
          "icon" text NOT NULL DEFAULT 'freedom',
          "current" integer NOT NULL DEFAULT 0,
          "target" integer NOT NULL DEFAULT 0,
          "targetDate" text NOT NULL DEFAULT '',
          "targetYear" integer NOT NULL DEFAULT 2030,
          "monthly" integer NOT NULL DEFAULT 0,
          "expectedReturn" double precision NOT NULL DEFAULT 5,
          "requiredReturn" double precision NOT NULL DEFAULT 4,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS personal_goals_userId_slug_key ON personal_goals ("userId", "slug");
        CREATE TABLE IF NOT EXISTS personal_connections (
          "id" serial PRIMARY KEY,
          "userId" text NOT NULL,
          "provider" text NOT NULL,
          "connectionType" text NOT NULL DEFAULT 'manual',
          "status" text NOT NULL DEFAULT 'connected',
          "label" text NOT NULL DEFAULT '',
          "lastSyncAt" timestamp,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS personal_connections_userId_idx ON personal_connections ("userId");
        ALTER TABLE personal_accounts ADD COLUMN IF NOT EXISTS "connectionId" integer;
        ALTER TABLE personal_holdings ADD COLUMN IF NOT EXISTS "connectionId" integer;
        ALTER TABLE personal_holdings ADD COLUMN IF NOT EXISTS "isin" text NOT NULL DEFAULT '';
        ALTER TABLE personal_holdings ADD COLUMN IF NOT EXISTS "quantity" double precision NOT NULL DEFAULT 0;
        ALTER TABLE personal_holdings ADD COLUMN IF NOT EXISTS "unitPrice" double precision NOT NULL DEFAULT 0;
      `)
    })().catch((error) => {
      ensured = null
      throw error
    })
  }
  return ensured
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PersonalProfile = {
  firstName: string
  fullName: string
  email: string
  initials: string
  riskProfile: string
  riskScore: number
  age: number | null
  monthlySpending: number
}

export type AccountRow = {
  id: number
  name: string
  type: string
  kind: 'investment' | 'property' | 'cash' | 'liability'
  value: number
  region: string
  status: 'Connected' | 'Manual'
  refreshed: string
}

export type NetWorth = {
  total: number
  monthChange: number
  monthChangePct: number
  investments: number
  property: number
  cash: number
  liabilities: number
}

export type HealthFactor = { name: string; score: number; note: string }

export type HoldingRow = Holding & { id: number; assetClass: string; currency: string }

export type PersonalSnapshot = {
  profile: PersonalProfile
  isEmpty: boolean
  netWorth: NetWorth
  netWorthSeries: Record<Period, { date: string; value: number }[]>
  allocation: Record<'asset' | 'geography' | 'currency' | 'account', AllocationSlice[]>
  health: { score: number; factors: HealthFactor[] }
  holdings: HoldingRow[]
  portfolio: { value: number; dayChange: number; dayChangePct: number }
  accounts: AccountRow[]
  goals: Goal[]
}

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
]

/* ------------------------------------------------------------------ */
/* Deterministic helpers                                               */
/* ------------------------------------------------------------------ */

function hashSeed(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random walk bridged so it starts at `start` and ends exactly at `end`. */
function bridgedSeries(start: number, end: number, n: number, vol: number, seed: number) {
  const rand = mulberry32(seed)
  const walk = [0]
  for (let i = 1; i < n; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 2 * vol)
  const drift = walk[n - 1]
  return walk.map((w, i) => {
    const t = i / (n - 1)
    return start + (end - start) * t + (w - drift * t)
  })
}

function buildSeries(total: number, seed: number): Record<Period, { date: string; value: number }[]> {
  const today = new Date()
  const cfg: Record<Period, { points: number; stepDays: number; startRatio: number; vol: number }> = {
    '1M': { points: 30, stepDays: 1, startRatio: 0.958, vol: total * 0.004 },
    '3M': { points: 45, stepDays: 2, startRatio: 0.925, vol: total * 0.006 },
    '1Y': { points: 52, stepDays: 7, startRatio: 0.835, vol: total * 0.01 },
    '5Y': { points: 60, stepDays: 30.4, startRatio: 0.415, vol: total * 0.014 },
    ALL: { points: 90, stepDays: 30.4, startRatio: 0.143, vol: total * 0.013 },
  }
  const out = {} as Record<Period, { date: string; value: number }[]>
  for (const period of Object.keys(cfg) as Period[]) {
    const c = cfg[period]
    if (total <= 0) {
      out[period] = [{ date: today.toISOString(), value: 0 }]
      continue
    }
    const values = bridgedSeries(Math.round(total * c.startRatio), total, c.points, c.vol, seed + c.points)
    out[period] = values.map((v, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - Math.round((c.points - 1 - i) * c.stepDays))
      return { date: d.toISOString(), value: Math.max(0, Math.round(v)) }
    })
  }
  return out
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function toSlices(groups: Map<string, number>, base: number): AllocationSlice[] {
  if (base <= 0) return []
  return [...groups.entries()]
    .map(([name, value]) => ({ name, value: Math.round((value / base) * 100) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((s, i) => ({ name: s.name, value: s.value, color: PALETTE[i % PALETTE.length] }))
}

function groupSum<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const map = new Map<string, number>()
  for (const row of rows) map.set(key(row), (map.get(key(row)) ?? 0) + value(row))
  return map
}

/* ------------------------------------------------------------------ */
/* Derivations                                                         */
/* ------------------------------------------------------------------ */

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function deriveHealth(
  holdings: Holding[],
  portfolioValue: number,
  cash: number,
  monthlySpending: number,
  goals: Goal[],
): { score: number; factors: HealthFactor[] } {
  const topWeight = portfolioValue > 0 ? Math.max(0, ...holdings.map((h) => (h.value / portfolioValue) * 100)) : 0
  const sectorMap = groupSum(holdings, (h) => h.sector, (h) => h.value)
  const topSectorWeight = portfolioValue > 0 ? Math.max(0, ...[...sectorMap.values()].map((v) => (v / portfolioValue) * 100)) : 0
  const taxAdvantaged = holdings
    .filter((h) => ['ISA', 'SIPP', 'Pension'].includes(h.account))
    .reduce((s, h) => s + h.value, 0)
  const taxShare = portfolioValue > 0 ? (taxAdvantaged / portfolioValue) * 100 : 0
  const cashMonths = monthlySpending > 0 ? cash / monthlySpending : cash > 0 ? 12 : 0
  const goalAlignment = goals.length ? goals.reduce((s, g) => s + g.probability, 0) / goals.length : 50

  const diversification = clamp(100 - clamp(topWeight - 10, 0, 50) * 2)
  const concentration = clamp(100 - clamp(topSectorWeight - 25, 0, 50) * 1.6)
  const liquidity = clamp((cashMonths / 9) * 100)
  const taxEfficiency = clamp(40 + taxShare * 0.6)
  const alignment = clamp(goalAlignment)

  const factors: HealthFactor[] = [
    { name: 'Diversification', score: Math.round(diversification), note: topWeight > 0 ? `Largest holding is ${topWeight.toFixed(0)}% of the portfolio` : 'Add holdings to assess diversification' },
    { name: 'Goal alignment', score: Math.round(alignment), note: goals.length ? `${goals.filter((g) => g.probability >= 70).length} of ${goals.length} goals on track or ahead` : 'No goals set yet' },
    { name: 'Liquidity', score: Math.round(liquidity), note: cashMonths > 0 ? `${cashMonths.toFixed(1)} months of expenses in cash` : 'No cash accounts added' },
    { name: 'Tax efficiency', score: Math.round(taxEfficiency), note: `${taxShare.toFixed(0)}% of investments held in ISA or pension wrappers` },
    { name: 'Risk concentration', score: Math.round(concentration), note: topSectorWeight > 0 ? `Largest sector is ${topSectorWeight.toFixed(0)}% of the portfolio` : 'Add holdings to assess concentration' },
  ]
  const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length)
  return { score, factors }
}

/* ------------------------------------------------------------------ */
/* Snapshot                                                            */
/* ------------------------------------------------------------------ */

export async function getPersonalSnapshot(sessionUser: { id: string; name: string; email: string }): Promise<PersonalSnapshot> {
  await ensurePersonalTables()
  const userId = sessionUser.id

  const [profileRow] = await db.select().from(personalProfile).where(eq(personalProfile.userId, userId)).limit(1)
  if (!profileRow) {
    await db.insert(personalProfile).values({ userId }).onConflictDoNothing()
  }

  const [accountRows, holdingRows, goalRows] = await Promise.all([
    db.select().from(personalAccounts).where(eq(personalAccounts.userId, userId)).orderBy(asc(personalAccounts.id)),
    db.select().from(personalHoldings).where(eq(personalHoldings.userId, userId)).orderBy(asc(personalHoldings.id)),
    db.select().from(personalGoals).where(eq(personalGoals.userId, userId)).orderBy(asc(personalGoals.id)),
  ])

  const firstName = sessionUser.name?.split(/\s+/)[0] || 'there'
  const initials =
    sessionUser.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'ME'
  const profile: PersonalProfile = {
    firstName,
    fullName: sessionUser.name || 'You',
    email: sessionUser.email,
    initials,
    riskProfile: profileRow?.riskProfile ?? 'Balanced',
    riskScore: profileRow?.riskScore ?? 5,
    age: profileRow?.age ?? null,
    monthlySpending: profileRow?.monthlySpending ?? 0,
  }

  const accounts: AccountRow[] = accountRows.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    kind: a.kind,
    value: a.value,
    region: a.region,
    status: a.status,
    refreshed: a.status === 'Connected' ? relativeTime(a.updatedAt) : `Updated ${a.updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
  }))

  const sumKind = (kind: AccountRow['kind']) => accounts.filter((a) => a.kind === kind).reduce((s, a) => s + a.value, 0)
  const investments = sumKind('investment')
  const property = sumKind('property')
  const cash = sumKind('cash')
  const liabilities = sumKind('liability')
  const total = investments + property + cash + liabilities

  const seed = hashSeed(userId)
  const netWorthSeries = buildSeries(total, seed)
  const firstOfMonth = netWorthSeries['1M'][0]?.value ?? total
  const monthChange = total - firstOfMonth
  const monthChangePct = firstOfMonth > 0 ? (monthChange / firstOfMonth) * 100 : 0

  const netWorth: NetWorth = { total, monthChange, monthChangePct, investments, property, cash, liabilities }

  const holdings: HoldingRow[] = holdingRows.map((h) => ({
    id: h.id,
    name: h.name,
    ticker: h.ticker,
    value: h.value,
    returnPct: h.returnPct,
    dayPct: h.dayPct,
    account: h.accountLabel as Holding['account'],
    goal: h.goal,
    sector: h.sector,
    region: h.region,
    assetClass: h.assetClass,
    currency: h.currency,
    aiView: { tone: 'neutral', label: h.accountLabel ? 'Holding' : 'Holding' },
  }))

  const portfolioValue = holdings.reduce((s, h) => s + h.value, 0)
  const dayChange = holdings.reduce((s, h) => s + (h.value * h.dayPct) / 100, 0)
  const portfolio = {
    value: portfolioValue,
    dayChange: Math.round(dayChange),
    dayChangePct: portfolioValue > 0 ? (dayChange / portfolioValue) * 100 : 0,
  }

  const assetBase = portfolioValue
  const allocation = {
    asset: toSlices(groupSum(holdingRows, (h) => h.assetClass, (h) => h.value), assetBase),
    geography: toSlices(groupSum(holdingRows, (h) => h.region, (h) => h.value), assetBase),
    currency: toSlices(groupSum(holdingRows, (h) => h.currency, (h) => h.value), assetBase),
    account: toSlices(groupSum(holdingRows, (h) => h.accountLabel, (h) => h.value), assetBase),
  }

  const goals: Goal[] = goalRows.map((g) => {
    const { status, probability } = deriveGoalStatus(g.current, g.target, g.monthly, g.targetYear, g.expectedReturn)
    return {
      id: g.slug,
      name: g.name,
      description: g.description,
      current: g.current,
      target: g.target,
      targetDate: g.targetDate,
      targetYear: g.targetYear,
      monthly: g.monthly,
      expectedReturn: g.expectedReturn,
      requiredReturn: g.requiredReturn,
      status,
      probability,
      icon: g.icon,
    }
  })

  const health = deriveHealth(holdings, portfolioValue, cash, profile.monthlySpending, goals)
  const isEmpty = accounts.length === 0 && holdings.length === 0 && goals.length === 0

  return { profile, isEmpty, netWorth, netWorthSeries, allocation, health, holdings, portfolio, accounts, goals }
}

/* ------------------------------------------------------------------ */
/* Seeding / clearing (optional sample for first-run and demos)        */
/* ------------------------------------------------------------------ */

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function accountKindFor(a: (typeof SAMPLE_ACCOUNTS)[number]): AccountRow['kind'] {
  if (a.value < 0) return 'liability'
  if (/property|buy-to-let/i.test(a.type) || a.name === 'Property') return 'property'
  if (/cash|current|saving/i.test(a.type) || a.name === 'Cash Accounts') return 'cash'
  return 'investment'
}

const SAMPLE_ASSET_CLASS: Record<string, 'Equity' | 'Bonds' | 'Property' | 'Cash' | 'Alternatives'> = {
  Bonds: 'Bonds',
  Commodities: 'Alternatives',
  'Private Equity': 'Alternatives',
}

export async function loadSampleData(userId: string) {
  await ensurePersonalTables()
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'personal:' + userId}))`)
    await tx.delete(personalAccounts).where(eq(personalAccounts.userId, userId))
    await tx.delete(personalHoldings).where(eq(personalHoldings.userId, userId))
    await tx.delete(personalGoals).where(eq(personalGoals.userId, userId))

    await tx.insert(personalAccounts).values(
      SAMPLE_ACCOUNTS.map((a) => ({
        userId,
        name: a.name,
        type: a.type,
        kind: accountKindFor(a),
        value: a.value,
        region: a.region,
        status: a.status,
      })),
    )
    await tx.insert(personalHoldings).values(
      SAMPLE_HOLDINGS.map((h) => ({
        userId,
        name: h.name,
        ticker: h.ticker,
        value: h.value,
        returnPct: h.returnPct,
        dayPct: h.dayPct,
        assetClass: SAMPLE_ASSET_CLASS[h.sector] ?? 'Equity',
        accountLabel: h.account,
        sector: h.sector,
        region: h.region,
        currency: h.region === 'US' ? 'USD' : h.region === 'India' ? 'INR' : h.region === 'Europe' ? 'EUR' : 'GBP',
        goal: h.goal,
      })),
    )
    await tx.insert(personalGoals).values(
      SAMPLE_GOALS.map((g) => ({
        userId,
        slug: g.id,
        name: g.name,
        description: g.description,
        icon: g.icon,
        current: g.current,
        target: g.target,
        targetDate: g.targetDate,
        targetYear: g.targetYear,
        monthly: g.monthly,
        expectedReturn: g.expectedReturn,
        requiredReturn: g.requiredReturn,
      })),
    )
    await tx
      .insert(personalProfile)
      .values({
        userId,
        riskProfile: SAMPLE_USER.riskProfile,
        riskScore: SAMPLE_USER.riskScore,
        age: SAMPLE_USER.age,
        monthlySpending: 4300,
        seeded: true,
      })
      .onConflictDoUpdate({
        target: personalProfile.userId,
        set: { riskProfile: SAMPLE_USER.riskProfile, riskScore: SAMPLE_USER.riskScore, age: SAMPLE_USER.age, monthlySpending: 4300, seeded: true, updatedAt: new Date() },
      })
  })
}

export async function clearPersonalData(userId: string) {
  await ensurePersonalTables()
  await db.transaction(async (tx) => {
    await tx.delete(personalAccounts).where(eq(personalAccounts.userId, userId))
    await tx.delete(personalHoldings).where(eq(personalHoldings.userId, userId))
    await tx.delete(personalGoals).where(eq(personalGoals.userId, userId))
  })
}

export { slugify }
