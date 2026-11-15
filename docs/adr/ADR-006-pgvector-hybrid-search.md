> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-006: pgvector Extension for Hybrid Search

## Context

RailBandhan needs semantic search across community discussions and station recommendations without introducing a separate vector database (e.g. Pinecone, Qdrant, Milvus).

## Decision

Use PostgreSQL's native `pgvector` extension directly inside the primary database with `HNSW` index on embedding columns (`vector(384)`).

## Rationale

1. **Single Store Architecture**: Avoids network hops, separate database maintenance, and data synchronization lag.
2. **ACID Transactions**: Embeddings are updated in the same transaction as post creation.
3. **Hybrid Search**: Allows single-query combination of `tsvector` full-text search with vector cosine similarity.

## Consequences

- Requires PostgreSQL image with `pgvector` pre-installed (standard in official Supabase & Docker pgvector images).
