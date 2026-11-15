> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# Authorization Model

## Principle

```text
authenticated user + journey_members.status = 'verified' + resource belongs to that journey
```

Frontend checks are UX only. Backend API + Postgres RLS both enforce.

## Membership lifecycle

```text
pending → verified → expired
                 ↘ revoked
```

- Created on manual journey confirm or ticket extraction confirm.
- `expires_at` defaults to journey_date + 2 days (configurable).
- Cron marks `verified` → `expired` when past `expires_at`; journey status → `completed` then `archived`.

## Capability matrix (Phase 1)

| Action                              | Requirement                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| List my journeys                    | Auth                                                         |
| Get journey detail                  | Verified membership on that journey                          |
| Read/create posts                   | Verified membership for community’s journey                  |
| Comment / react                     | Same                                                         |
| Read/send chat                      | Verified membership for room’s journey                       |
| Live train status                   | Verified membership on a journey for that train+date         |
| Upload ticket                       | Auth + rate limit                                            |
| Read another user’s private profile | Never                                                        |
| Read anonymous profile              | Auth; limited fields; discovery_visible for roster (Phase 2) |
| Admin actions                       | role = admin (Phase 2 UI)                                    |

## Segment access

- **Train-wide community**: any verified membership on a journey with same `train_id` + `journey_date`.
- **Segment community**: membership whose boarding/destination stop indices overlap the segment (Phase 1 creates train-wide primarily; segment tables ready).

## Anti-IDOR rules

For every request with a resource id:

1. Resolve resource → owning `journey_id` (or deny).
2. `requireVerifiedMembership(auth.uid(), journey_id)`.
3. On failure: **403** with generic message; do not leak member counts or titles of unauthorized journeys beyond what the client already knew from the URL.

Do not accept client flags like `isPassenger`.

## RLS sketches

### journey_members

- SELECT: `user_id = auth.uid()` OR (same journey and both verified — limited; prefer API for peer lists)
- INSERT/UPDATE: own rows via service or authenticated policies carefully scoped

### posts / comments / messages

- SELECT/INSERT: exists verified membership for `auth.uid()` on the community/room journey

### profiles

- SELECT/UPDATE: `user_id = auth.uid()` only

### anonymous_profiles

- SELECT: authenticated users may read public columns
- UPDATE: owner only

### tickets / ticket_extractions

- SELECT/ALL: `user_id = auth.uid()` only; service role for cleanup jobs

### audit_logs

- No client access; service role only

## Realtime

Before subscribing to `journey:{id}:chat`, server verifies membership. Unauthorized subscribe attempts are rejected and audited.
