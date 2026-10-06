'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { personalAccounts, personalGoals, personalHoldings, personalProfile } from '@/lib/db/schema'
import { requirePersonal } from '@/lib/roles'
import { clearPersonalData, ensurePersonalTables, loadSampleData, slugify } from '@/lib/personal/store'

export type ActionResult = { ok: true } | { ok: false; error: string }

const money = z.coerce.number().int().min(-1_000_000_000).max(1_000_000_000)
const pct = z.coerce.number().min(-100).max(1000)
const shortText = z.string().trim().min(1).max(120)

const accountSchema = z.object({
  name: shortText,
  type: z.string().trim().max(120).default(''),
  kind: z.enum(['investment', 'property', 'cash', 'liability']),
  value: money,
  region: z.string().trim().max(40).default('UK'),
  status: z.enum(['Connected', 'Manual']).default('Manual'),
})

const holdingSchema = z.object({
  name: shortText,
  ticker: z.string().trim().max(24).default(''),
  value: z.coerce.number().int().min(0).max(1_000_000_000),
  returnPct: pct.default(0),
  dayPct: pct.default(0),
  assetClass: z.enum(['Equity', 'Bonds', 'Property', 'Cash', 'Alternatives']),
  accountLabel: z.string().trim().max(40).default('GIA'),
  sector: z.string().trim().max(60).default('Diversified'),
  region: z.string().trim().max(40).default('Global'),
  currency: z.string().trim().max(8).default('GBP'),
  goal: z.string().trim().max(80).default(''),
})

const goalSchema = z.object({
  name: shortText,
  description: z.string().trim().max(400).default(''),
  icon: z.enum(['freedom', 'education', 'home', 'retirement', 'car']),
  current: z.coerce.number().int().min(0).max(1_000_000_000),
  target: z.coerce.number().int().min(1).max(1_000_000_000),
  targetYear: z.coerce.number().int().min(new Date().getFullYear()).max(2100),
  monthly: z.coerce.number().int().min(0).max(10_000_000),
  expectedReturn: z.coerce.number().min(0).max(30).default(5),
})

function fail(error: z.ZodError): ActionResult {
  return { ok: false, error: error.issues[0]?.message ?? 'Invalid input' }
}

function revalidatePersonal() {
  revalidatePath('/me', 'layout')
}

/* ------------------------------- Accounts -------------------------------- */

export async function addAccount(input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  await ensurePersonalTables()
  const data = parsed.data
  await db.insert(personalAccounts).values({
    userId: user.id,
    name: data.name,
    type: data.type,
    kind: data.kind,
    value: data.kind === 'liability' ? -Math.abs(data.value) : Math.abs(data.value),
    region: data.region,
    status: data.status,
  })
  revalidatePersonal()
  return { ok: true }
}

export async function updateAccount(id: number, input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid account' }
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  const data = parsed.data
  await db
    .update(personalAccounts)
    .set({
      name: data.name,
      type: data.type,
      kind: data.kind,
      value: data.kind === 'liability' ? -Math.abs(data.value) : Math.abs(data.value),
      region: data.region,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(personalAccounts.id, id), eq(personalAccounts.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

export async function deleteAccount(id: number): Promise<ActionResult> {
  const user = await requirePersonal()
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid account' }
  await db.delete(personalAccounts).where(and(eq(personalAccounts.id, id), eq(personalAccounts.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

/* ------------------------------- Holdings -------------------------------- */

export async function addHolding(input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  const parsed = holdingSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  await ensurePersonalTables()
  await db.insert(personalHoldings).values({ userId: user.id, ...parsed.data })
  revalidatePersonal()
  return { ok: true }
}

export async function updateHolding(id: number, input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid holding' }
  const parsed = holdingSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  await db
    .update(personalHoldings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(personalHoldings.id, id), eq(personalHoldings.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

export async function deleteHolding(id: number): Promise<ActionResult> {
  const user = await requirePersonal()
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: 'Invalid holding' }
  await db.delete(personalHoldings).where(and(eq(personalHoldings.id, id), eq(personalHoldings.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

/* -------------------------------- Goals ---------------------------------- */

async function uniqueGoalSlug(userId: string, name: string) {
  const base = slugify(name) || 'goal'
  const existing = await db
    .select({ slug: personalGoals.slug })
    .from(personalGoals)
    .where(eq(personalGoals.userId, userId))
  const taken = new Set(existing.map((r) => r.slug))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

export async function addGoal(input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  await ensurePersonalTables()
  const data = parsed.data
  const slug = await uniqueGoalSlug(user.id, data.name)
  await db.insert(personalGoals).values({
    userId: user.id,
    slug,
    name: data.name,
    description: data.description,
    icon: data.icon,
    current: data.current,
    target: data.target,
    targetDate: `December ${data.targetYear}`,
    targetYear: data.targetYear,
    monthly: data.monthly,
    expectedReturn: data.expectedReturn,
    requiredReturn: Math.max(0, data.expectedReturn - 0.6),
  })
  revalidatePersonal()
  return { ok: true }
}

export async function updateGoal(slug: string, input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,48}$/.test(slug)) return { ok: false, error: 'Invalid goal' }
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  const data = parsed.data
  await db
    .update(personalGoals)
    .set({
      name: data.name,
      description: data.description,
      icon: data.icon,
      current: data.current,
      target: data.target,
      targetDate: `December ${data.targetYear}`,
      targetYear: data.targetYear,
      monthly: data.monthly,
      expectedReturn: data.expectedReturn,
      requiredReturn: Math.max(0, data.expectedReturn - 0.6),
      updatedAt: new Date(),
    })
    .where(and(eq(personalGoals.slug, slug), eq(personalGoals.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

export async function deleteGoal(slug: string): Promise<ActionResult> {
  const user = await requirePersonal()
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,48}$/.test(slug)) return { ok: false, error: 'Invalid goal' }
  await db.delete(personalGoals).where(and(eq(personalGoals.slug, slug), eq(personalGoals.userId, user.id)))
  revalidatePersonal()
  return { ok: true }
}

/* ------------------------------- Profile --------------------------------- */

const profileSchema = z.object({
  riskProfile: z.string().trim().max(60),
  riskScore: z.coerce.number().int().min(1).max(10),
  age: z.coerce.number().int().min(16).max(120).optional(),
  monthlySpending: z.coerce.number().int().min(0).max(10_000_000),
})

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await requirePersonal()
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error)
  await ensurePersonalTables()
  const data = parsed.data
  await db
    .insert(personalProfile)
    .values({ userId: user.id, riskProfile: data.riskProfile, riskScore: data.riskScore, age: data.age ?? null, monthlySpending: data.monthlySpending })
    .onConflictDoUpdate({
      target: personalProfile.userId,
      set: { riskProfile: data.riskProfile, riskScore: data.riskScore, age: data.age ?? null, monthlySpending: data.monthlySpending, updatedAt: new Date() },
    })
  revalidatePersonal()
  return { ok: true }
}

/* ------------------------- Sample data / clear --------------------------- */

export async function loadSample(): Promise<ActionResult> {
  const user = await requirePersonal()
  await loadSampleData(user.id)
  revalidatePersonal()
  return { ok: true }
}

export async function clearAll(): Promise<ActionResult> {
  const user = await requirePersonal()
  await clearPersonalData(user.id)
  revalidatePersonal()
  return { ok: true }
}
