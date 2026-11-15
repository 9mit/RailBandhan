> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Complete Setup & Environment Guide

This document provides exact, comprehensive setup instructions for local development, testing, and production deployment of the RailBandhan platform.

---

## 1. Prerequisites & System Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- **Git**: `v2.40+`
- **Optional for Cloud Deployment**:
  - [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
  - [Vercel CLI](https://vercel.com/docs/cli) (`npm install -g vercel`)

---

## 2. Quickstart for Local Development

### Step 1: Install Dependencies

```bash
# In project root
npm install
```

### Step 2: Configure Local Environment

Create `.env.local` in `apps/web/`:

```bash
cp .env.example apps/web/.env.local
```

### Step 3: Run Test Suite

```bash
npm run test
```

All 22 test suites and 68 automated tests will execute across authentication, privacy isolation, OCR extraction, journey routing, games, chat, and adversarial security boundaries.

### Step 4: Validate Production Pre-Flight Checklist

```bash
npm run preflight
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Database & Supabase Configuration

### Step 1: Create Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com).
2. Click **"New Project"**.
3. Choose Region: `ap-south-1` (Mumbai) for optimal latency for Indian Railway passengers.
4. Set a strong database password and copy your project URL and API keys.

### Step 2: Apply Database Migrations

Run the SQL migration files in sequence using the Supabase SQL Editor or CLI:

1. `supabase/migrations/20260810000001_init.sql`: Core schema, trains catalog, stations, journeys, posts, chat, and RLS policies.
2. `supabase/migrations/20260810000002_phase2_phase3.sql`: Conversations, DMs, games sessions, polls, badges, and moderation reporting.
3. `supabase/migrations/20260810000003_rls_hardening.sql`: Hardened expiry checks, prevent self-verify, and least-privilege game updates.
4. `supabase/migrations/20260810000004_railway_graph_pgvector.sql`: Dynamic station graph connections and vector semantic index.

### Step 3: Configure Storage Buckets

In Supabase Dashboard > **Storage**:

1. Create Bucket: `railbandhan-tickets-private`
   - **Public bucket**: `FALSE` (Strictly Private)
   - File size limit: `10MB`
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
2. Storage Policy: Users can only upload and read their own tickets (`auth.uid() = (storage.foldername(name))[1]`).

---

## 4. Redis Configuration (Upstash / Redis Cloud / Valkey)

1. Create a serverless Redis database on [Upstash](https://upstash.com) in `ap-south-1` (Mumbai) or run Valkey 7.2.
2. Copy the `rediss://...` connection URL into `REDIS_URL`.
3. Used for:
   - Distributed rate limiting on auth, OCR upload, and chat message endpoints.
   - Ephemeral passenger presence tracking.

---

## 5. Private Object Storage (Cloudflare R2 / AWS S3 / MinIO)

1. Create a private bucket named `railbandhan-tickets-private` in Cloudflare R2 or AWS S3.
2. Generate an API token with Read/Write access strictly scoped to this bucket.
3. Set `S3_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
4. Enable an automatic 30-day lifecycle expiration rule to purge old processed ticket files according to data retention policy.

---

## 6. Verification & Operational Commands

| Command              | Description                                                                       |
| :------------------- | :-------------------------------------------------------------------------------- |
| `npm run lint`       | Runs Next.js ESLint checks                                                        |
| `npm run typecheck`  | Validates complete TypeScript type safety (`tsc --noEmit`)                        |
| `npm run test`       | Executes Vitest unit, integration, and security test suites (22 suites, 68 tests) |
| `npm run preflight`  | Runs automated production readiness preflight validator                           |
| `npm run smoke-test` | Executes automated smoke checks against live or local deployment                  |
| `npm run build`      | Builds optimized production Next.js application bundle                            |
| `npm run audit:prod` | Runs complete full-stack audit pipeline (lint, typecheck, test, build)            |
