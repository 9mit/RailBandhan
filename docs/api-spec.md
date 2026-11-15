> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# API Specification (Phase 1)

Base: `/api/v1`  
Auth: Supabase session cookie / Bearer access token  
Validation: Zod on all bodies/queries  
Errors: `{ error: { code, message } }` — no stack traces

## Auth

| Method | Path           | Notes                     |
| ------ | -------------- | ------------------------- |
| POST   | `/auth/signup` | email, password → session |
| POST   | `/auth/login`  | email, password           |
| POST   | `/auth/logout` |                           |
| GET    | `/auth/me`     | user + profiles summary   |

Google OAuth via Supabase hosted flow when `GOOGLE_*` configured.

## Profiles

| Method | Path                          | Authz                                     |
| ------ | ----------------------------- | ----------------------------------------- |
| POST   | `/profiles/onboarding`        | Auth; creates private + anonymous profile |
| PATCH  | `/profiles/anonymous`         | Owner                                     |
| PATCH  | `/profiles/privacy`           | Owner                                     |
| GET    | `/profiles/me`                | Owner                                     |
| GET    | `/profiles/anonymous/:handle` | Auth; public fields only                  |

## Journeys

| Method | Path                   | Authz                                                    |
| ------ | ---------------------- | -------------------------------------------------------- |
| GET    | `/journeys`            | Auth; **only memberships of caller**                     |
| POST   | `/journeys/manual`     | Auth; create/find journey + verified membership (manual) |
| GET    | `/journeys/:id`        | Verified membership else **403**                         |
| GET    | `/journeys/:id/status` | Verified membership                                      |

## Tickets

| Method | Path                               | Authz                             |
| ------ | ---------------------------------- | --------------------------------- |
| POST   | `/tickets/upload`                  | Auth; multipart; rate limited     |
| GET    | `/tickets/extractions/:id`         | Owner                             |
| POST   | `/tickets/extractions/:id/confirm` | Owner; creates journey membership |

## Community

| Method | Path                   | Authz                        |
| ------ | ---------------------- | ---------------------------- |
| GET    | `/journeys/:id/posts`  | Verified membership          |
| POST   | `/journeys/:id/posts`  | Verified membership          |
| GET    | `/posts/:id/comments`  | Membership on post’s journey |
| POST   | `/posts/:id/comments`  | Same                         |
| POST   | `/posts/:id/reactions` | Same                         |
| DELETE | `/posts/:id/reactions` | Same                         |

## Chat

| Method | Path                     | Authz                             |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/journeys/:id/messages` | Verified membership               |
| POST   | `/journeys/:id/messages` | Verified membership; rate limited |

Realtime channel: `journey:{journeyId}:chat` (membership required).

## Account

| Method | Path       | Authz                              |
| ------ | ---------- | ---------------------------------- |
| DELETE | `/account` | Auth; deletes/anonymizes user data |

## Handler pattern

```ts
const user = await requireUser(req);
await requireVerifiedMembership(user.id, journeyId);
```

## Rate limits (Redis)

- Ticket upload: 5 / hour / user
- Messages: 30 / minute / user / journey
- Posts: 10 / minute / user / journey
- Auth login: 10 / 15 min / IP
