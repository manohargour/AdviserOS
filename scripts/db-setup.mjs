// Provisions the database by running the idempotent db/setup.sql.
// Uses the pg driver already in dependencies — no extra tooling required.
// Run with `pnpm db:setup`. Requires DATABASE_URL (read from the environment
// or from .env.local as a convenience).

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Load DATABASE_URL from .env.local if it isn't already set (no dependency).
try {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] = value
  }
} catch {
  // No .env.local — rely on the ambient environment.
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it or add it to .env.local, then re-run `pnpm db:setup`.')
  process.exit(1)
}

const sql = readFileSync(join(root, 'db', 'setup.sql'), 'utf8')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(sql)
  console.log('✓ Database tables are ready.')
} catch (error) {
  console.error('Failed to set up the database:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await pool.end()
}
