> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan Production Audit Report

**Date:** 10 August 2026  
**Scope:** Full repository, running in-memory MVP (`DATA_STORE=memory`)  
**Commands run:** `npm run lint`, `npm run typecheck`, `npm test` (13 passing), `npm run build` (pre-audit), adversarial service tests  
**Supabase / Redis / S3 / live IRCTC:** NOT VERIFIED — dependencies not wired

---

## Executive Summary

RailBandhan is a well-structured **modular monolith** with a strong _idea_ of journey-membership authorization. In the running app, TypeScript services generally deny cross-journey posts, chat, DMs, games, and polls. That is real, and regression tests prove it.

It is **not production-ready**.

The implemented stack is **not** the documented stack. There is no live Supabase Auth, no Postgres at runtime, no RLS enforcement in the running process, no Redis, no S3, no Tesseract, and no Realtime. Auth is a homegrown HMAC cookie. Tickets sit on local disk. “Verified passenger” can be obtained by typing a train number. OCR text can be pasted by the client when a dev flag is on. Segment communities exist only in SQL. Mock train data was previously unlabeled.

This audit found exploitable issues, fixed the worst of them, and added regression tests. Remaining High items are enough to **forbid real ticket uploads**.

**Would I allow real passengers to upload railway tickets today? No.**

---

## Overall Rating

```text
NOT READY
```

## Risk Summary (after audit fixes)

```text
Critical:       0 remaining (2 fixed during audit)
High:           8 remaining (5 fixed during audit)
Medium:         11
Low:            9
Informational:  8
```

## Scores

| Score        | Value    | Basis                                                                                          |
| ------------ | -------- | ---------------------------------------------------------------------------------------------- |
| Security     | 61 / 100 | Cross-journey TS authz works; no runtime RLS/Realtime; weak verification; cookie HMAC sessions |
| Functional   | 72 / 100 | Happy-path MVP works locally; mock OCR/trains; no password reset                               |
| Privacy      | 70 / 100 | Anonymous handles mostly held; ticket/PNR handling improved; still easy fake membership        |
| Architecture | 54 / 100 | Good module boundaries; severe drift from stated production architecture                       |

---

## Architecture Assessment

**Documented:** Next.js + Supabase Auth + Postgres RLS + Realtime + Redis + S3 + Tesseract OCR + TrainDataProvider.

**Actual runtime:**

```text
Browser → Next.js App Router
        → Cookie HMAC session (rb_session)
        → In-memory Store singleton
        → HeuristicTicketParser (regex)
        → MockTrainDataProvider
```

`getStore()` always returns memory, even if `DATA_STORE=supabase`. `@supabase/ssr`, `ioredis`, and S3 env vars are unused. `TicketParser` and `TrainDataProvider` interfaces exist and are the right abstraction.

This is an acceptable **local MVP**, not a production security boundary.

---

## Authentication Audit

| Check                   | Result                                            |
| ----------------------- | ------------------------------------------------- |
| Signup / login / logout | Works (in-memory users)                           |
| Session cookie          | HttpOnly, SameSite=Lax, Secure in production      |
| Password hashing        | scrypt + salt + timingSafeEqual                   |
| Password reset          | Missing                                           |
| Email verification      | Missing                                           |
| OAuth                   | Flag only, unused                                 |
| Session revocation      | None (HMAC cookie; logout is client cookie clear) |
| Account enumeration     | Signup returns distinct “already exists”          |
| Middleware auth         | Added during audit (cookie presence)              |
| Default secrets         | Production now refuses weak/missing secrets       |

**HIGH remaining:** no email verify, no reset, non-revocable sessions, in-memory user DB.

---

## Authorization / Journey Membership Audit

`requireVerifiedMembership` is used on journey-scoped services. Tests prove:

- Same train+date → allowed
- Different train → 403
- Same train, different date → 403
- Expired membership → 403 (TS layer)

**Manual join still creates `status=verified` immediately.** Product allows manual entry, but that means any registered user who knows a train number and date can enter that community. Rate limit + max 8 active journeys added; this is still not ticket verification.

Segment communities: **schema only. NOT VERIFIED.**

---

## RLS Audit

RLS SQL exists for Phase 1/2 tables. **NOT VERIFIED at runtime** — app never connects to Postgres.

Audit-fixed SQL (`20260810000003_rls_hardening.sql`):

- `is_verified_member` / `can_access_train_date` now require `expires_at > now()`
- `journey_members` insert limited to `status=pending` (no self-verify)
- `game_sessions` update limited to host/players

Until a Supabase store adapter is implemented and RLS is tested with two JWTs, treat RLS as **unverified**.

---

## Realtime Security Audit

**NOT VERIFIED — not implemented.** Chat/DM/games/live poll. No channel authorization to attack. Knowing `journeyId` does not grant a socket today because there is no socket.

---

## Ticket / OCR / Storage Audit

Before fix: client `Content-Type` trusted, no magic bytes, `scanStatus: 'clean'` hardcoded, client `ocr_text` trusted, files left after account delete.

After fix:

- Magic bytes for PDF/JPEG/PNG required
- Client MIME ignored
- Client OCR ignored unless `ALLOW_CLIENT_OCR_TEXT=true`
- Account delete unlinks ticket files
- Extraction API still omits PNR

**HIGH remaining:** no malware scanner, local unencrypted disk, no S3/KMS, heuristic OCR is not Tesseract, demo flag must never ship enabled.

---

## Privacy Audit

| Data                     | Collected           | Public?                       | Notes                              |
| ------------------------ | ------------------- | ----------------------------- | ---------------------------------- |
| Real name / age / gender | Yes                 | No (own `/auth/me` only)      |                                    |
| Email                    | Yes                 | Own session only              | Enumeration via signup             |
| Phone                    | No                  |                               |                                    |
| PNR                      | Optional on confirm | No; HMAC only after confirm   |                                    |
| Coach/seat               | Optional extract    | No; `coach_visibility` unused |                                    |
| Ticket file              | Yes                 | No                            | Local disk                         |
| Boarding/destination     | Yes                 | Journey members               | Inherent to community              |
| Internal user UUID       | Was leaked          | Reduced                       | Games/passengers/comments redacted |
| GPS                      | No                  |                               | Good                               |

---

## API Security Audit (selected)

| Endpoint                        | Auth        | Authz                           | Rate limit  | Risk                            |
| ------------------------------- | ----------- | ------------------------------- | ----------- | ------------------------------- |
| POST /auth/login                | Public      | —                               | 10/15m/IP   | Brute force reduced             |
| POST /auth/signup               | Public      | —                               | 8/h/IP      | Enumeration remains             |
| POST /journeys/manual           | User        | None beyond login               | 5/h + cap 8 | Fake membership                 |
| GET /journeys/:id/*             | User        | Verified membership             | Partial     | Good TS gate                    |
| POST /tickets/upload            | User        | Owner                           | 5/h         | Magic bytes now                 |
| POST /conversations             | User        | Shared journey + policy + block | 20/h        | Fixed empty-thread block bypass |
| GET /profiles/anonymous/:handle | User        | Auth only                       | No          | Enumeration of handles          |
| POST /moderation/reports        | Mod role    | Server role check               | No          | No self-escalation API          |
| POST /jobs/retention            | CRON_SECRET | Bearer                          | —           | Must not leak secret            |

Zod is installed but unused; validation is ad hoc.

---

## Chat / DM / Games

Chat: membership-gated, 30/min rate limit, polling. Cannot spoof `authorId` (server sets it).

DM: start requires shared verified journey + messaging policy + block. **Block bypass on empty conversation FIXED** and regression-tested.

Games: server validates turns/occupancy. Spectators cannot move. Player UUIDs no longer returned in API state.

---

## Moderation

Roles live on `AuthUser.role`. No HTTP to change role. Memory mode has no seeded admin. Reporting works; queue UI 403s for normal users. Journey-moderator vs global-admin distinction is not implemented.

---

## Train Data

`TrainDataProvider` + `MockTrainDataProvider` only. Live UI now labels **demo data**. Failures return not_found. Cache/Redis: not implemented. **NOT VERIFIED** against any real railway API.

---

## Database Integrity

SQL migrations have FKs, uniques `(user_id, journey_id)`, check constraints. Runtime memory store approximates some uniques (e.g. membership key) but is not transactional across multi-step flows. Race conditions possible under concurrent Node cluster (single-process MVP only).

---

## Testing Audit

| Suite                                            | Result      |
| ------------------------------------------------ | ----------- |
| lint                                             | Pass        |
| typecheck                                        | Pass        |
| unit normalization                               | Pass        |
| cross-journey Phase 1                            | Pass        |
| cross-journey Phase 2 (DM/games/polls/discovery) | Pass        |
| adversarial audit regressions                    | Pass (5)    |
| Total                                            | **13 / 13** |
| HTTP E2E / Playwright                            | Missing     |
| RLS with live Postgres                           | Missing     |
| Realtime                                         | N/A         |

---

## UX / Functional / Accessibility / Mobile

Happy path locally: signup → onboarding → manual journey → live/community/chat → games → DM. Ticket upload works as demo OCR when `ALLOW_CLIENT_OCR_TEXT=true`.

Gaps: no password reset, no connection-status banner, no offline queue, mock train unlabeled until this audit, Games/DM usable but not polished, accessibility is basic labels only (no dedicated a11y pass), bottom nav is thumb-friendly.

---

## Dependency Audit

`npm audit` reports **High** issues in the `next` → `postcss` / `sharp` tree (PostCSS source map / stringify). Do not jump to Next 16 without a dedicated upgrade. Unused deps: `@supabase/ssr`, `@supabase/supabase-js`, `ioredis`, `zod` (installed unused).

---

## Data Retention / Account Deletion

Policy doc vs code drifted. Audit expanded `anonymizeUserContent` to remove DMs, conversations, notifications (including counterpart conversation notifs), games, poll votes, badges, and unlink ticket files. Posts/comments/chat still hard-deleted rather than `[deleted]` anonymized. Backup/log retention **NOT VERIFIED**.

---

## Infrastructure / Deployment

No Docker, CI, Vercel config, or production env matrix. `.env.local` gitignored. `.env.example` now includes `SESSION_SECRET`. No HSTS (needs HTTPS terminator). CSP added (still allows `'unsafe-inline'`/`'unsafe-eval'` for Next).

---

## Security Test Matrix

| Attack                         | Expected   | Actual (after fixes)         | Status          |
| ------------------------------ | ---------- | ---------------------------- | --------------- |
| Cross-journey post/chat/live   | Denied     | Denied                       | Pass            |
| Cross-journey DM               | Denied     | Denied                       | Pass            |
| Cross-journey games/polls      | Denied     | Denied                       | Pass            |
| Cross-journey realtime         | Denied     | N/A — not implemented        | NOT VERIFIED    |
| Ticket IDOR                    | Denied     | Owner-only 404               | Pass (service)  |
| PNR in API                     | Absent     | Absent                       | Pass            |
| Fake MIME ticket               | Rejected   | Rejected (magic bytes)       | Pass            |
| Client OCR spoof               | Rejected   | Rejected unless flag         | Pass            |
| DM after block (empty thread)  | Denied     | Denied                       | Pass (was fail) |
| Game illegal move / wrong turn | Rejected   | Rejected                     | Pass            |
| Game UUID leak                 | Absent     | Redacted                     | Pass            |
| Role escalation via API        | Denied     | Denied                       | Pass            |
| RLS self-verify insert         | Denied     | SQL fixed; runtime N/A       | NOT VERIFIED    |
| Segment isolation              | Denied     | Unimplemented                | NOT VERIFIED    |
| XSS (React text)               | Encoded    | No `dangerouslySetInnerHTML` | Likely pass     |
| SQL injection                  | N/A memory | No raw SQL in app            | Pass (app)      |
| Secrets in client bundle       | Absent     | No service role in src       | Pass            |

---

## Critical Findings

None remaining after audit fixes.

### Fixed: AUD-C1 Session/PNR HMAC fallback usable in production

**Was Critical.** Hardcoded `railbandhan-dev-only-*` secrets. Production now throws if secret missing or matches weak patterns.

### Fixed: AUD-C2 DM block bypass

**Was Critical/High.** `sendDirectMessage` inferred recipient from message history; empty conversation skipped `assertCanMessage`. Now uses `listConversationParticipants` always.

---

## High Findings (remaining)

### AUD-H1 Architecture drift / no runtime RLS

**Component:** store, supabase  
If this ships as-is, all user/ticket/chat data lives in one Node process with no Postgres RLS, no HA, no durable deletion. Connecting Supabase later without re-testing RLS would reintroduce self-verify and game-update bugs (mitigated in SQL, still untested live).

### AUD-H2 Unverified “verified” membership

Manual journey still grants full community/chat/DM/games access. Attack: register, POST `/journeys/manual` with `12723` + date + SC/NDLS.

### AUD-H3 Ticket pipeline still not production-grade

No malware scan, no encryption at rest, local disk, heuristic OCR, optional client OCR flag.

### AUD-H4 Non-revocable HMAC sessions

Stolen cookie works until expiry (7 days). Logout does not invalidate server-side.

### AUD-H5 No email verification / password reset

Account takeover and impersonation risk; no recovery path.

### AUD-H6 Segment isolation unimplemented

Cannot claim segment security. Train-wide only.

### AUD-H7 Realtime unimplemented

Cannot claim channel auth. Polling only.

### AUD-H8 Next/PostCSS High advisories

`npm audit` High via next→postcss source map disclosure class bugs. Needs planned upgrade, not a blind major bump.

---

## Medium Findings

1. Signup email enumeration
2. In-memory rate limits (not Redis; per-process)
3. CSRF relies on SameSite=Lax + Origin check; no CSRF token
4. Public handle lookup enumerates usernames (now auth-required)
5. `coach_visibility` unused
6. Logger still does not scan free-text message bodies for PNR
7. Posts hard-deleted on account delete (community continuity vs policy)
8. No CAPTCHA / bot scoring
9. `zod` unused — inconsistent input validation
10. Mock/demo OCR UX depends on env flag
11. Moderation unusable without out-of-band role seed

---

## Low Findings

Unused supabase-js/ioredis; no search; no connection banner; a11y incomplete; `unsafe-inline` CSP; no HSTS in app; no CI; giant some components; `as unknown as` in game parser; filename-based OCR fixtures; 404 vs 403 existence oracles on some IDs.

---

## Informational

Interfaces for OCR and trains are correctly replaceable. No `dangerouslySetInnerHTML`. No GPS. Docs exist. Bottom nav mobile-first. Security tests are now the strongest part of the repo.

---

## Fixed During Audit

1. DM block/policy check on participant list (not message history)
2. DM notifications use anonymous handle, not message body
3. Ticket magic-byte validation; ignore client MIME
4. Ignore client OCR unless `ALLOW_CLIENT_OCR_TEXT`
5. Account deletion: ticket files, DMs, notifications, games, poll votes, badges
6. Stop leaking other users’ UUIDs in passengers, comments, games
7. Production refuses weak session/PNR secrets
8. Logger redacts `realName`, `ocrText`, `filename`
9. RLS SQL: expiry, pending-only membership insert, game update least privilege
10. Rate limits: login, signup, manual journey, DM
11. Max 8 active journeys per user
12. Middleware: cookie gate + Origin check on mutating APIs
13. CSP header; mock train status labeled in UI + `data_source: mock`
14. Anonymous profile GET requires auth
15. Adversarial regression tests (5)

---

## Remaining Issues

Wire real Supabase store + test RLS with two users; replace HMAC cookies with Supabase Auth; real OCR behind server-only parser; malware scan + encrypted S3; ticket verification or clearly downgrade manual members; implement or drop segment communities; Realtime with join auth; Redis rate limits; email verify + password reset; session revocation; CI; dependency upgrade; legal review of ticket processing; CAPTCHA; moderation role bootstrap.

---

## Production Readiness

```text
NOT READY
```

No Criticals remain in the TypeScript layer after fixes, but High items AUD-H1–H8 and the launch rule (“missing RLS on sensitive data”, “ticket/PNR exposure risk”, “unverified realtime”) still fail the gate.

---

## TOP 10 ACTIONS BEFORE LAUNCH

| #   | Action                                                                 | Priority | Impact                        | Effort |
| --- | ---------------------------------------------------------------------- | -------- | ----------------------------- | ------ |
| 1   | Implement Supabase store + Auth; enable RLS; two-user RLS test         | P0       | Stops data loss + self-verify | L      |
| 2   | Server-only OCR; disable client `ocr_text` in all non-dev envs         | P0       | Stops fake tickets            | M      |
| 3   | Encrypted private S3 + malware scan + signed URLs + deletion proof     | P0       | Ticket privacy                | L      |
| 4   | Downgrade or throttle manual membership vs ticket-extracted privileges | P0       | Stops community flooding      | M      |
| 5   | Email verification + password reset + server-side session revocation   | P0       | Account safety                | M      |
| 6   | Redis rate limits + CAPTCHA on signup/ticket/manual journey            | P1       | Abuse                         | M      |
| 7   | Realtime (if shipped) with membership-gated private channels + tests   | P1       | Chat scale/security           | L      |
| 8   | Segment auth using route stop indexes — or remove from docs            | P1       | Honest security model         | M      |
| 9   | Patch Next/PostCSS advisory; add CI (lint/test/build/audit)            | P1       | Supply chain                  | M      |
| 10  | Legal review: ticket PII, IRCTC data, minors, ToS/privacy              | P1       | Compliance                    | M      |

---

## Final Verdict

**Would I personally allow real passengers to upload their railway tickets and use this application today?**

**No.**

The authorization _idea_ is sound and the TS gates for cross-journey access are real. The implementation is still an in-memory demo with spoofable journey membership, no durable RLS, no real OCR, unencrypted local tickets, and non-revocable cookies. Shipping this to Indian Railway passengers would be reckless.

Use it as a **local prototype**. Do not collect real PNRs until items 1–5 above are done and re-audited.
