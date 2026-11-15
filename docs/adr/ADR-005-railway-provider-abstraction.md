> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-005: Railway Provider & Telemetry Abstraction Layer

## Context

Railway schedule data, route graphs, and telemetry statuses must be accessible reliably without hardcoding external commercial provider schemas.

## Decision

Create an abstract `TrainDataProvider` and `RailwayDataRepository`. Provide three swappable implementations:

1. `MockTrainDataProvider`: Deterministic simulation provider for dev, CI, and testing.
2. `OpenDataTrainProvider`: Ingests canonical open datasets (data.gov.in, OSM, public timetables).
3. `ExternalRailwayProvider`: Optional adapter for commercial live APIs with circuit-breaker, caching, and exponential backoff.

## Rationale

- Decouples the entire application from upstream railway provider APIs.
- Guarantees zero downtime if an external telemetry provider fails or alters its schema.
