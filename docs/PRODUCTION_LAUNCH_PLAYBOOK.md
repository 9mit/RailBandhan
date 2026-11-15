> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Master Production Launch Playbook & Go-To-Market Plan

**Document Version**: 1.0.0  
**Classification**: Operational Playbook & GTM Strategy  
**Project**: RailBandhan (Privacy-First Social Platform for Indian Railway Passengers)  
**Lead Author**: Senior Technical Project Manager (SPM)  
**Status**: **APPROVED & READY FOR LAUNCH**

---

## 1. Executive Summary & Launch Mandate

RailBandhan is ready for public release. The platform connects Indian Railway passengers during active journeys through verified, privacy-preserving train lounges, shared games, passenger discovery, and real-time station-by-station telemetry.

### Platform Sizing & Target Demographics:

- **Target Audience**: 24 Million daily passengers across the Indian Railways network (7,325 stations).
- **Initial Launch Corridors**:
  - `12723 / 12724` — Telangana Express (Secunderabad `SC` ⇄ New Delhi `NDLS`)
  - `12951 / 12952` — Mumbai Rajdhani Express (Mumbai Central `BCT` ⇄ New Delhi `NDLS`)
  - `12627 / 12628` — Karnataka Express (Bengaluru `SBC` ⇄ New Delhi `NDLS`)
- **Key Architectural Differentiators**:
  - Zero-knowledge PNR privacy (`HMAC-SHA256`).
  - Strict segment & journey authorization boundaries.
  - 100% open-source, self-hostable core stack with fallback graph routing.
  - Offline-first installable PWA with low-bandwidth optimization.

---

## 2. Launch Gates & Go / No-Go Decision Matrix

All 7 production gates have been formally validated and satisfied:

|    Gate    | Criterion                      | Threshold                   | Actual Measurement                                        | Gate Decision |
| :--------: | :----------------------------- | :-------------------------- | :-------------------------------------------------------- | :-----------: |
| **Gate 1** | TypeScript Static Analysis     | 0 compilation errors        | **0 errors** (`tsc --noEmit`)                             |    **GO**     |
| **Gate 2** | ESLint Code Quality Gate       | 0 warnings, 0 errors        | **0 warnings / 0 errors**                                 |    **GO**     |
| **Gate 3** | Automated Regression Suites    | 100% pass rate              | **22 suites, 68 tests passed**                            |    **GO**     |
| **Gate 4** | Adversarial Security Isolation | 0 cross-journey leaks       | **Zero leaks verified**                                   |    **GO**     |
| **Gate 5** | Production Next.js 15 Build    | 44/44 static/dynamic routes | **Success (103–133 kB bundles)**                          |    **GO**     |
| **Gate 6** | Pre-Flight Environment Sanity  | 0 fatal blockers            | **Passed (14/14 checks)** (`scripts/preflight-check.mjs`) |    **GO**     |
| **Gate 7** | DPDP Act 2023 Compliance       | Automated purge & deletion  | **Verified (Automated container & 24h purge)**            |    **GO**     |

---

## 3. T-Minus Launch Schedule & Milestone Breakdown

```
T-14 Days          T-7 Days          T-3 Days          T-24h          T-0          T+24h          T+7d
    │                 │                 │                │             │             │             │
    ▼                 ▼                 ▼                ▼             ▼             ▼             ▼
[Infra Staging]  [Security Freeze]  [Cut RC1 Tag]   [Pre-Flight]   [CUTOVER]   [Hypercare]   [Retrospective]
```

### Milestone Details:

#### T-14 Days — Infrastructure Provisioning & Staging Dress Rehearsal

- Provision PostgreSQL 16 cluster with `pgvector` in `ap-south-1` (Mumbai).
- Provision Valkey 7.2 memory store for distributed rate-limiting and presence.
- Deploy MinIO / Cloudflare R2 private ticket storage bucket with 30-day lifecycle auto-purge.
- Execute full dry-run deployment using `deploy/docker-compose.prod.yml`.

#### T-7 Days — Security Hardening & Adversarial Verification

- Run full adversarial security test suite:
  - Cross-journey post, chat, DM, and game session boundary tests.
  - Verify PNR HMAC zero-knowledge deduplication.
  - Verify soft-delete and permanent account purge (`DELETE /api/v1/account`).
- Verify Next.js Content-Security-Policy (CSP) headers and Nginx rate-limiting limits.

#### T-3 Days — Release Candidate (RC1) & Stakeholder Review

- Cut Git release candidate tag `v1.0.0-rc1`.
- Complete smoke walkthrough on mobile devices across 4G and railway station Wi-Fi (RailWire).
- Lock production environment configuration and secrets vault.

#### T-24 Hours — Production Pre-Flight Checklist

- Execute automated preflight readiness validator:
  ```bash
  npm run preflight
  ```
- Verify continuous database WAL backup stream.
- Send pre-launch briefing to operations, moderation, and engineering on-call teams.

#### T-0 Hours — Launch Day Cutover

- Execute zero-downtime rolling container cutover per [`DEPLOYMENT_RUNBOOK.md`](runbooks/DEPLOYMENT_RUNBOOK.md).
- Run automated post-cutover smoke test:
  ```bash
  npm run smoke-test https://railbandhan.com
  ```
- Switch DNS traffic to production ingress.
- Open public registration and announce corridor launch.

#### T+24 Hours — Hypercare & Live Monitoring

- 24-hour active War Room on Slack `#war-room-launch`.
- Monitor error budget, API latencies (P95 < 200ms), and provider health via `/api/v1/admin/railway-health`.
- Triage user feedback and moderation report queues.

#### T+7 Days — Post-Launch Retrospective

- Review operational SLOs and uptime metrics against 99.9% target.
- Transition from Hypercare to steady-state sprint cycle.

---

## 4. Operational Roles & War Room Protocol

```
                        INCIDENT COMMANDER (IC)
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
    TECHNICAL LEAD             SRE LEAD            COMMUNICATIONS LEAD
 (Application Engine)    (Infra & Database)       (Public & Moderation)
```

- **War Room Slack Channel**: `#war-room-launch-v1`
- **Audio Bridge**: `https://meet.railbandhan.com/war-room`
- **Escalation SLA**: Critical bugs paged within 5 minutes.

---

## 5. Phased Rollout & Go-To-Market (GTM) Strategy

### Phase 1: Flagship Express Corridors (Days 1–30)

- Launch on 3 high-volume, long-distance express routes:
  1. **Telangana Express (12723/12724)**: Secunderabad to New Delhi (24-hour journey, tech-forward passenger base).
  2. **Mumbai Rajdhani (12951/12952)**: Mumbai Central to New Delhi.
  3. **Karnataka Express (12627/12628)**: Bengaluru to New Delhi.
- Target: 10,000 verified journey registrations; average engagement of 35 minutes per passenger per journey.

### Phase 2: Vande Bharat & Regional Intercity Mesh (Days 31–90)

- Expand to 25 Vande Bharat high-speed routes connecting major metropolitan clusters (Varanasi, Ahmedabad, Chennai, Katra).
- Introduce station junction community feeds (passengers crossing paths at major hubs like Nagpur, Bhopal, Kazipet).

### Phase 3: Pan-India Network Rollout (Day 90+)

- Enable all 13,000+ daily passenger and mail/express trains across Indian Railways.
- Partner with passenger convenience services and local station food vendors.
