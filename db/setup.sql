-- Idempotent database setup for AdviserOS.
--
-- Safe to run against a brand-new database (creates everything) or an existing
-- one (every statement is guarded, so nothing is altered or dropped and no data
-- is touched). This is the canonical provisioning step — run `pnpm db:setup`.
--
-- The first four tables are owned by better-auth; they are included so a fresh
-- database is fully provisioned in one step. On an existing database they are
-- left untouched.

CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'adviser' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);

-- Adviser workspace --------------------------------------------------------

CREATE TABLE IF NOT EXISTS "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clientSlug" text,
	"name" text NOT NULL,
	"due" text NOT NULL,
	"readiness" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"confirmedItems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approvedAt" timestamp,
	"letterDraft" text,
	"letterUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"client" text NOT NULL,
	"due" text NOT NULL,
	"source" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"client" text NOT NULL,
	"clientSlug" text,
	"severity" text NOT NULL,
	"time" text NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clientSlug" text,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clientSlug" text,
	"title" text NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clientSlug" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"coverNote" text,
	"letter" text,
	"recipientEmail" text,
	"submittedAt" timestamp,
	"approvedAt" timestamp,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "report_acknowledgements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clientSlug" text NOT NULL,
	"reportId" integer,
	"token" text NOT NULL,
	"sentTo" text NOT NULL,
	"acknowledgedAt" timestamp,
	"acknowledgedName" text,
	"comment" text,
	"personalUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_acknowledgements_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "report_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"reportId" integer NOT NULL,
	"userId" text NOT NULL,
	"toEmail" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"providerId" text,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

-- Personal (Meridian) ------------------------------------------------------

CREATE TABLE IF NOT EXISTS "personal_profile" (
	"userId" text PRIMARY KEY NOT NULL,
	"riskProfile" text DEFAULT 'Balanced' NOT NULL,
	"riskScore" integer DEFAULT 5 NOT NULL,
	"age" integer,
	"baseCurrency" text DEFAULT 'GBP' NOT NULL,
	"monthlySpending" integer DEFAULT 0 NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "personal_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'investment' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"region" text DEFAULT 'UK' NOT NULL,
	"status" text DEFAULT 'Manual' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "personal_holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" integer,
	"name" text NOT NULL,
	"ticker" text DEFAULT '' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"returnPct" double precision DEFAULT 0 NOT NULL,
	"dayPct" double precision DEFAULT 0 NOT NULL,
	"assetClass" text DEFAULT 'Equity' NOT NULL,
	"accountLabel" text DEFAULT 'GIA' NOT NULL,
	"sector" text DEFAULT 'Diversified' NOT NULL,
	"region" text DEFAULT 'Global' NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"goal" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "personal_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'freedom' NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"target" integer DEFAULT 0 NOT NULL,
	"targetDate" text DEFAULT '' NOT NULL,
	"targetYear" integer DEFAULT 2030 NOT NULL,
	"monthly" integer DEFAULT 0 NOT NULL,
	"expectedReturn" double precision DEFAULT 5 NOT NULL,
	"requiredReturn" double precision DEFAULT 4 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Unique indexes -----------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "clients_userId_slug_key" ON "clients" ("userId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "personal_goals_userId_slug_key" ON "personal_goals" ("userId", "slug");
