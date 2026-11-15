> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-004: Open-Weight AI Strategy & Task-Based Model Routing

## Context

AI capabilities (travel assistant, semantic search, spam detection, summarization) must operate without external API keys, at minimal cost, and with strict privacy.

## Decision

1. Standardize on open-weight Apache 2.0 / MIT models:
   - **Embeddings**: `BAAI/bge-small-en-v1.5` (33M parameters)
   - **Fast Classification**: `Qwen/Qwen2.5-0.5B-Instruct` (0.49B parameters)
   - **Grounded Assistant RAG**: `Qwen/Qwen2.5-1.5B-Instruct` (CPU) or `7B-Instruct` (GPU)
2. Use **Ollama** for local development and **vLLM / llama.cpp** for production.
3. Model routing directs tasks to the smallest sufficient model.

## Rationale

- The database is authoritative for facts; the LLM is strictly the natural language presentation layer.
- Running small models locally ensures predictable response times (< 200ms) without API billing surprises.

## Consequences

- The application functions 100% when all AI features are disabled.
