> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan Architecture

## Overview

RailBandhan is a privacy-first social platform for Indian Railway passengers. Access to journey communities is gated by **verified journey membership**, enforced in Postgres RLS and Next.js API handlers — never by the client alone.

## Stack

| Layer                    | Technology                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Frontend                 | Next.js 15 App Router, React, TypeScript, Tailwind CSS                                 |
| Auth (local MVP)         | Cookie session (`rb_session`) + scrypt passwords via in-memory store                   |
| Auth (production target) | Supabase Auth (email/password; Google OAuth when configured)                           |
| Database (local MVP)     | In-memory `Store` (`DATA_STORE=memory`) with same domain model                         |
| Database (production)    | Supabase Postgres + Row Level Security                                                 |
| Realtime (Phase 1)       | Polling for chat/feed; Supabase Realtime channels designed for Phase 2 wiring          |
| Cache                    | Redis optional; in-memory rate limits in MVP                                           |
| Ticket storage           | Local `.data/tickets` or S3-compatible (ephemeral)                                     |
| OCR                      | `TicketParser` interface → HeuristicTicketParser (MVP); swap for Tesseract/cloud later |
| Train data               | `TrainDataProvider` interface → MockTrainDataProvider (MVP)                            |

## High-level components

```text
Browser (PWA-capable shell)
    ↓ HTTPS
Next.js App Router
  ├── UI (RSC + Client Components)
  └── Route Handlers / Server Actions
         ↓
    ┌────┴────┬──────────┬─────────┐
 Supabase   Redis     S3 Temp   OCR Worker
 Auth/DB/   Cache/    Tickets   (TicketParser)
 Realtime   Limits
```

## Trust zones

1. **Public** — landing, marketing, auth pages. No journey data.
2. **Authenticated** — session required; still no cross-journey access.
3. **Journey-authorized** — verified `journey_members` row required for feed, chat, live status, passenger counts.
4. **Owner-private** — profiles (real name), tickets, PNR hashes, audit internals.
5. **Service** — service-role key only on server; never shipped to browser.

## Journey identity

- Internal security ID: UUID (`journeys.id`)
- Dedup key: `normalized_key = TRAIN_{number}_{YYYY-MM-DD}_{from}_{to}`
- Communities: one **train-wide** community per `(train_id, journey_date)` plus optional **segment** communities per boarding→destination

## Ticket processing pipeline

```text
Upload
  → MIME / size validation
  → Malware scan hook (stub in MVP; ClamAV-ready)
  → Encrypt + write to temp S3 (short TTL)
  → TicketParser.extract()
  → Normalize against train/station catalog
  → Persist ticket_extractions draft (no long-lived raw file unless opted in)
  → User confirmation UI
  → Create/find journey + verified membership (method=ticket_extracted)
  → Delete raw object; scrub plaintext PNR (keep HMAC only)
```

## Realtime

- Channel naming: `journey:{journeyId}:chat`, `journey:{journeyId}:feed`
- Join requires verified membership (API checks before issuing channel access; RLS on `messages` / `posts`)
- Events: `new_message`, `message_deleted`, `new_post`, `reaction_added`, `train_status_updated`

## Train status cache

```text
TrainDataProvider.getLiveStatus(trainNumber, date)
  → Redis GET train:status:{number}:{date}
  → on miss: provider fetch → SETEX (60–120s)
  → return to client only if caller has verified membership on a matching journey
```

## Security boundaries

- Client never receives service-role key, PNR plaintext, ticket URLs, or other users’ private profiles.
- All journey-scoped APIs call `requireVerifiedMembership(userId, journeyId)`.
- Logging redacts email, phone, real name, PNR, seat, coach.
- No public passenger directory; Phase 1 exposes only online/member **counts** for authorized journeys.

## Phase 2 — Social & discovery

| Module          | Path                             | Description                                                   |
| --------------- | -------------------------------- | ------------------------------------------------------------- |
| DM              | `server/dm/service`              | Private 1:1 conversations scoped to shared journey membership |
| Discovery       | `server/discovery/service`       | Opt-in passenger list for verified journey members            |
| Notifications   | `server/notifications/service`   | In-app notification feed (DM, polls, games)                   |
| Moderation      | `server/moderation/service`      | Reports, blocks, moderator queue (`MODERATOR_USER_IDS`)       |
| Games           | `server/games/engine`            | Server-authoritative Tic-Tac-Toe & Connect Four               |
| Polls           | `server/polls/service`           | Journey-scoped polls with single vote per member              |
| Reputation      | `server/reputation/service`      | Badges and public anonymous profiles                          |
| Recommendations | `server/recommendations/service` | Home feed from posts, polls, and open games                   |

API routes live under `apps/web/src/app/api/v1/` (conversations, notifications, games, polls, etc.).

## Phase 3 — PWA

- `public/manifest.webmanifest` — standalone shell, theme `#c2410c`
- `public/sw.js` — offline cache for `/`, `/home`, and static assets
- `components/pwa/register-sw.tsx` — client SW registration in root layout

Push notifications and advanced offline sync remain future work.

## Phase 2/3 roadmap (legacy note)

Earlier MVP docs listed these as future; they are now implemented in the web app with in-memory store backing.
