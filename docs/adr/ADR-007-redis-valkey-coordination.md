> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-007: Redis / Valkey for Distributed Caching & Rate Limiting

## Context

Ephemeral operations such as token bucket rate limiting, realtime WebSocket connection tracking, and transient train status caching require sub-millisecond key-value storage.

## Decision

Use Redis or its open-source fork Valkey (BSD-3-Clause) as the distributed caching and coordination layer, backed by an in-memory fallback adapter when Redis is not configured.

## Rationale

- High performance for rapid rate limit decrementing and active session tracking.
- Memory fallback allows single-node local development without requiring Redis.

## Consequences

- Redis state is treated as ephemeral; all durable state is stored in PostgreSQL.
