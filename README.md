# RailBandhan

Every journey, a new connection. An independent Indian train travel community built with Next.js, React, TypeScript, PostgreSQL, Redis-compatible rate limits and private local ticket extraction.

The rebuilt interface uses warm paper, deep green, terracotta, architectural arches, Indian rail imagery and a cinematic train film. Journeys, train lounges, direct messages, games, polls, discovery, notifications, profiles and moderation remain connected to the application APIs. No invented passengers, online indicators, badges or live telemetry are shown as real activity.

## Start locally

Use Node.js 24. PDF/image extraction also needs Poppler (`pdftotext`, `pdftoppm`) and Tesseract. Without those binaries, use manual journey entry.

```bash
npm --prefix apps/web ci
cp .env.example apps/web/.env.local
npm run dev
```

Open the address printed by Next.js. SQLite is the default local store. Private local files are created under `apps/web/.data`, outside the public directory. An empty account needs an anonymous profile and a journey before community features become available.

For a local PostgreSQL environment:

```bash
docker compose up -d postgres valkey
```

Set `DATA_STORE=postgres` and `DATABASE_URL` in `apps/web/.env.local`. Export `DATABASE_URL` into the shell before running `npm run db:migrate`. Native operational scripts read shell environment variables; Next.js reads its own `.env.local`.

## Validate

```bash
npm run lint
npm run typecheck
npm run test
npm audit --prefix apps/web
npm run preflight
npm run build
```

The build packages the standalone server with its public assets. `npm run start` runs that artifact and requires the production environment described below. Development and production builds use separate output directories.

## Engineering and operations

| Document                                               | Contents                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Rebuild report](docs/REBUILD_REPORT.md)               | Final changes, observed validation and handoff status                             |
| [Rebuild plan](docs/REBUILD_PLAN.md)                   | Implementation sequence and scope boundaries                                      |
| [Architecture review](docs/ARCHITECTURE_REVIEW.md)     | System boundaries, data model, tradeoffs, scaling and next improvements           |
| [Security review](docs/SECURITY_REVIEW.md)             | Findings, implemented controls, evidence and remaining launch gates               |
| [Performance review](docs/PERFORMANCE_REVIEW.md)       | Measured asset/build results and performance verification limits                  |
| [Production deployment](docs/PRODUCTION_DEPLOYMENT.md) | Local, staging, production, secrets, migrations, backups, rollback and monitoring |
| [Production readiness](docs/PRODUCTION_READINESS.md)   | Completed checks and the checks still required before public launch               |
| [File review inventory](docs/FILE_REVIEW.md)           | Every current source file, asset and configuration, with review coverage          |
| [Design system](docs/DESIGN_SYSTEM.md)                 | Palette, typography, motion, accessibility and screen treatment                   |

The implementation is a release candidate, not a blanket production certification. Production credentials, HTTPS, actual container/wire-protocol CI results, email account recovery, mobile accessibility verification, load tests and an observed disaster-recovery exercise remain release gates. No live infrastructure was deployed during this rebuild.

The files under `supabase/` are historical experiments, not the database schema used by this implementation. Use the canonical application schema and migration runner, not those legacy migrations. Older audit reports are retained as history and are superseded by the reviews linked above.
