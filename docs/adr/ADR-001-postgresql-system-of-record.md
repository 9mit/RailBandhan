> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-001: PostgreSQL as Primary System of Record

## Context

RailBandhan requires relational integrity, strict ACID transactions, temporal TTL constraints for journey data, full-text search, and multi-tenant isolation.

## Decision

Use PostgreSQL (15+) as the authoritative system of record for all persistent domains: users, profiles, journeys, tickets, communities, messages, reports, and game states.

## Rationale

1. **Self-Hostable Anywhere**: Runs in standard Docker, bare-metal Linux VPS, or managed cloud without vendor lock-in.
2. **Rich Extensibility**: Supports `pgcrypto` (cryptographic hashing), `pgvector` (dense vector embeddings), and `btree_gist`.
3. **Defense-in-Depth Security**: Native Row-Level Security (RLS) guarantees data isolation directly inside the database engine.

## Consequences

- Database schema migrations must be strictly versioned and backward-compatible.
- Direct database connection pooling is managed via Supavisor / PgBouncer.
