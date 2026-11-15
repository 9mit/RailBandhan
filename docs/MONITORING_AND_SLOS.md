> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Observability, Monitoring & SLO Specification

**Classification**: Site Reliability Engineering / Telemetry  
**Scope**: Production Reliability Metrics, Health Endpoints, and Alerting Baselines

---

## 1. Service Level Indicators (SLIs) & Objectives (SLOs)

| Metric                    | Target Service Level Objective (SLO)                         | Measurement Method                           | Error Budget (30-day rolling) |
| :------------------------ | :----------------------------------------------------------- | :------------------------------------------- | :---------------------------- |
| **API Availability**      | **≥ 99.9%** successful requests (`2xx`/`3xx`/`4xx` vs `5xx`) | Ingress gateway access logs                  | 43.8 minutes downtime / month |
| **Read Route Latency**    | **P95 < 200ms**, **P99 < 400ms**                             | `/api/v1/home/feed`, `/api/v1/journeys/[id]` | Max 5% exceeding 200ms        |
| **Write Route Latency**   | **P95 < 350ms**, **P99 < 700ms**                             | Post creation, chat messages, game moves     | Max 5% exceeding 350ms        |
| **Ticket OCR Pipeline**   | **P95 < 1200ms**                                             | `/api/v1/tickets/upload` end-to-end          | Max 5% exceeding 1200ms       |
| **Gaming Move Roundtrip** | **P95 < 100ms**                                              | Move validation & board state broadcast      | Max 5% exceeding 100ms        |

---

## 2. Error Budget Policy

- **Remaining Budget > 50%**: Standard feature releases and rapid iterations permitted.
- **Remaining Budget 20% - 50%**: Heightened deployment scrutiny; changes require Senior PM / Staff Engineer approval.
- **Remaining Budget < 20%**: Production feature freeze initiated. Sprints focus exclusively on reliability, performance optimization, and bug fixing.

---

## 3. Production Health Probes

### 1. Ingress Liveness Probe

- **Endpoint**: `GET /api/health`
- **Purpose**: Fast, unauthenticated probe for CDN load balancers and Kubernetes kubelet.
- **Response**:
  ```json
  {
    "status": "ok",
    "version": "0.1.0",
    "services": {
      "database": "ok",
      "auth": "ok",
      "realtime": "ok",
      "storage": "ok"
    },
    "timestamp": "2026-10-29T15:47:18.000Z"
  }
  ```

### 2. Readiness Probe

- **Endpoint**: `GET /api/v1/health`
- **Purpose**: Verifies database query execution (`listTrains()`) and store connectivity before accepting live passenger traffic.
- **HTTP Status Codes**:
  - `200 OK`: System healthy and ready.
  - `503 Service Unavailable`: Store unreachable or degraded.

### 3. Deep Railway Telemetry & Fallback Health

- **Endpoint**: `GET /api/v1/admin/railway-health`
- **Authorization**: Moderator or Admin session cookie.
- **Payload**: Detailed breakdown of primary railway API providers, latency scores, and fallback transition logs.

---

## 4. Alerting Thresholds & Paging Matrix

| Alert Name                  | Condition                                    | Severity      | Action                                         |
| :-------------------------- | :------------------------------------------- | :------------ | :--------------------------------------------- |
| **HighErrorRate**           | Ingress `5xx` > 1% over 5 minutes            | **P1 (Page)** | Trigger On-Call SRE PagerDuty                  |
| **DatabasePoolExhaustion**  | Connection pool utilization > 85% for 3 mins | **P1 (Page)** | Auto-scale PgBouncer pool; alert DBA           |
| **TicketOcrBacklog**        | Ticket processing queue depth > 50 jobs      | **P2 (Warn)** | Alert worker scaling group                     |
| **RailwayProviderDegraded** | Primary provider failure rate > 20% over 5m  | **P3 (Info)** | Automatic fallback triggered; log notification |
| **StorageQuotaApproaching** | S3 bucket capacity exceeds 80% threshold     | **P3 (Info)** | Notify DevOps to verify lifecycle purge        |
