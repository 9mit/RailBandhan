> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Incident Response Playbook

**Classification**: Operations / Security / Reliability Engineering  
**Audience**: On-Call Engineers, Incident Commanders, Operations Leads

---

## 1. Incident Severity Matrix

|   Level   | Severity Name                            | Impact Criteria                                                                                           | Initial Response SLA | Status Update Cadence |
| :-------: | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :------------------: | :-------------------: |
| **SEV-1** | **Critical Platform Outage / Data Leak** | Total service outage, auth breakdown, security breach, cross-journey data leakage, PNR plaintext exposure |   **< 5 minutes**    |   Every 15 minutes    |
| **SEV-2** | **Major Degradation**                    | High error rates (> 2%), OCR extraction offline, live chat degraded, database failover in progress        |   **< 15 minutes**   |   Every 30 minutes    |
| **SEV-3** | **Moderate Impairment**                  | Non-critical feature failure (e.g. game moves, avatar upload), single station telemetry delay             |     **< 1 hour**     |     Every 2 hours     |
| **SEV-4** | **Minor / Cosmetic**                     | Visual bug, minor layout discrepancy, non-blocking copy issue                                             |    **< 8 hours**     |  Daily / Next Sprint  |

---

## 2. Command Team Roles (SEV-1 & SEV-2)

1. **Incident Commander (IC)**: Holds ultimate operational authority; assigns tasks, directs rollback or mitigation actions, shields engineering team from external chatter.
2. **Technical Lead (TL)**: Drives root cause diagnosis, leads log inspection, code diffs, and database query profiling.
3. **Communications Lead**: Prepares public status page updates (`status.railbandhan.com`) and passenger-facing advisories.
4. **Scribe**: Logs the chronological timestamp of all discoveries, actions, and config changes in the incident war room.

---

## 3. Incident Lifecycle Protocol

```
[Detect Alert / Anomaly]
       │
       ▼
[Triage Severity & Page IC]
       │
       ▼
[Open War Room & Bridge]
       │
       ▼
[Stabilize & Mitigate (Rollback / Feature Flag / Scale)]
       │
       ▼
[Verify Resolution via Smoke Tests]
       │
       ▼
[Stand Down & Publish Status Update]
       │
       ▼
[Root Cause Analysis & Post-Mortem within 48h]
```

---

## 4. Immediate Diagnostic Quick-Reference

### Health & Dependency Probe Check

```bash
curl -i https://railbandhan.com/api/health
```

### Review Realtime Server Logs

```bash
docker compose -f deploy/docker-compose.prod.yml logs -f --tail=300 web | grep -E "error|warn|AppError"
```

### Inspect Provider Router & Fallback State

```bash
curl -H "Authorization: Bearer <ADMIN_SESSION_TOKEN>" \
     https://railbandhan.com/api/v1/admin/railway-health
```

### Check Database Connection Pool

```bash
psql "$DATABASE_URL" -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

### Inspect Valkey / Redis Memory & Hit Rates

```bash
docker compose -f deploy/docker-compose.prod.yml exec valkey valkey-cli -a "$REDIS_PASSWORD" info memory
```

---

## 5. Post-Mortem Template

Every SEV-1 and SEV-2 incident requires a blameless post-mortem document covering:

1. **Executive Summary**: 2-sentence summary of what broke and user impact.
2. **Timeline of Events (UTC)**: Detailed chronological timeline from first breach to full resolution.
3. **Root Cause Analysis (5 Whys)**: Deep dive into the underlying failure mechanism.
4. **Impact Assessment**: Number of impacted passenger sessions, error rate percentage, downtime duration.
5. **Corrective Action Items**: P0/P1 preventative measures with designated owners and deadlines.
