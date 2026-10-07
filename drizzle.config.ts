import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  // Auth tables are owned by better-auth; keep drizzle focused on app tables.
  tablesFilter: ['!user', '!session', '!account', '!verification'],
})
