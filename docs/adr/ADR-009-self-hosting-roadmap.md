> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-009: Self-Hosting & Deployment Evolution Roadmap

## Context

RailBandhan must be easily deployable by single-developer contributors on laptops, while cleanly scaling to single VPS and clustered production deployments without rewrites.

## Decision

Adopt a 3-Stage Container-Based Deployment Architecture:

1. **Stage 1 (Local Dev)**: `docker compose up` running Next.js, Postgres with pgvector, Valkey, and MinIO.
2. **Stage 2 (Single VPS Production)**: Docker Compose behind Caddy on an 8GB-32GB RAM Linux VPS ($15-$45/mo).
3. **Stage 3 (Scale Clustered Production)**: Multiple Next.js instances behind Caddy/Nginx, dedicated PostgreSQL cluster with read replicas, Valkey cluster, MinIO cluster, and dedicated GPU inference box running vLLM.

## Rationale

- Prevents premature Kubernetes complexity.
- Keeps deployment instructions clear, reproducible, and verifiable with standard Docker tooling.
