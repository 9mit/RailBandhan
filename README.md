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

## Production Architecture

* **Framework & UI**: Next.js 15 (App Router), React 19, Tailwind CSS.
* **Storage & Persistence**: Production PostgreSQL adapter with ACID transactions, atomic refresh token family rotation, and local SQLite development fallback.
* **Security & Confidentiality**: AES-256-GCM ticket vault (`.rbv`) with zero-trust key isolation, salted SHA-256 opaque session hashing, and automatic data retention shredding.
* **Realtime Lounge & Games**: Authoritative server-side turn validation for multiplayer Tic-Tac-Toe, Connect Four, and Ludo; isolated journey chat corridors preventing cross-train leakage.
* **Deployment**: Standalone container deployment (`deploy/Dockerfile.web`, `deploy/docker-compose.prod.yml`, Nginx reverse proxy with security headers).
