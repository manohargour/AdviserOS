import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { Client } from '@/lib/data'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const clients = pgTable(
  'clients',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull(),
    data: jsonb('data').$type<Client>().notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('clients_userId_slug_key').on(t.userId, t.slug)],
)

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  clientSlug: text('clientSlug'),
  name: text('name').notNull(),
  due: text('due').notNull(),
  readiness: integer('readiness').notNull().default(0),
  status: text('status').notNull(),
  confirmedItems: jsonb('confirmedItems').$type<string[]>().notNull().default([]),
  approvedAt: timestamp('approvedAt'),
  letterDraft: text('letterDraft'),
  letterUpdatedAt: timestamp('letterUpdatedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  client: text('client').notNull(),
  due: text('due').notNull(),
  source: text('source').notNull(),
  done: boolean('done').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  client: text('client').notNull(),
  clientSlug: text('clientSlug'),
  severity: text('severity').$type<'high' | 'medium' | 'low'>().notNull(),
  time: text('time').notNull(),
  dismissed: boolean('dismissed').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  clientSlug: text('clientSlug'),
  actor: text('actor').$type<'adviser' | 'assistant'>().notNull(),
  action: text('action').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const chatThreads = pgTable('chat_threads', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  clientSlug: text('clientSlug'),
  title: text('title').notNull(),
  messages: jsonb('messages').$type<unknown[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  clientSlug: text('clientSlug').notNull(),
  title: text('title').notNull(),
  status: text('status').$type<'draft' | 'in_review' | 'approved' | 'sent'>().notNull().default('draft'),
  coverNote: text('coverNote'),
  letter: text('letter'),
  recipientEmail: text('recipientEmail'),
  submittedAt: timestamp('submittedAt'),
  approvedAt: timestamp('approvedAt'),
  sentAt: timestamp('sentAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const reportAcknowledgements = pgTable('report_acknowledgements', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  clientSlug: text('clientSlug').notNull(),
  reportId: integer('reportId'),
  token: text('token').notNull().unique(),
  sentTo: text('sentTo').notNull(),
  acknowledgedAt: timestamp('acknowledgedAt'),
  acknowledgedName: text('acknowledgedName'),
  comment: text('comment'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const reportSends = pgTable('report_sends', {
  id: serial('id').primaryKey(),
  reportId: integer('reportId').notNull(),
  userId: text('userId').notNull(),
  toEmail: text('toEmail').notNull(),
  subject: text('subject').notNull(),
  status: text('status').$type<'sent' | 'failed'>().notNull(),
  providerId: text('providerId'),
  error: text('error'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
