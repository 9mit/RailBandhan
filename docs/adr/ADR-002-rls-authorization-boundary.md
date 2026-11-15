> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-002: Row-Level Security (RLS) as Core Authorization Boundary

## Context

Application-level authorization checks in TypeScript are necessary but insufficient as a single point of failure. Direct SQL queries, batch jobs, and realtime listeners must never bypass security boundaries.

## Decision

Enforce Row-Level Security (RLS) policies on all tables containing user and journey data (`profiles`, `tickets`, `communities`, `posts`, `comments`, `chat_messages`, `direct_messages`, `game_sessions`).

## Rationale

1. **Engine-Level Guarantee**: Even if an application route handler contains a bug, PostgreSQL blocks unauthorized cross-user or cross-journey data retrieval.
2. **Journey-Scoped Isolation**: Policies require an active, verified row in `journey_memberships` for community and chat access.
3. **Admin / Moderator Segregation**: Moderator actions are permitted strictly when `auth_users.role` in `('moderator', 'admin')`.

## Consequences

- Service role access is restricted to explicit administrative background tasks.
- All client-facing queries run under authenticated role context (`auth.uid()`).
