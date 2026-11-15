> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Production Deployment Runbook

**Classification**: Operations / DevOps / SRE  
**Target Environment**: Production (ap-south-1 Mumbai)  
**Deployment Pattern**: Zero-Downtime Rolling / Blue-Green

---

## 1. Pre-Deployment Gate Checklist

Before initiating any deployment to production, the following automated gates must pass:

- [ ] **Continuous Integration**: GitHub Actions CI workflow completed cleanly on `main`.
- [ ] **Typecheck**: `npm run typecheck` returned zero errors (`tsc --noEmit`).
- [ ] **Linter**: `npm run lint` reported 0 errors and 0 warnings.
- [ ] **Automated Test Suite**: Vitest passed all 22 test files (68 automated tests).
- [ ] **Pre-Flight Validation**: `node scripts/preflight-check.mjs` exited with status code `0`.
- [ ] **Database Migrations Verified**: All forward migrations tested on staging without schema locks.
- [ ] **Cryptographic Secrets**: High-entropy `SESSION_SECRET` and `PNR_HMAC_SECRET` (≥ 32 chars) provisioned in target environment vault.

---

## 2. Standard Deployment Procedures

### Option A: Containerized Stack (Docker Compose / Swarm)

#### Step 1: Sync Source and Pull Assets

```bash
git fetch origin main
git checkout main
git pull origin main
```

#### Step 2: Validate Environment Secrets

```bash
node scripts/preflight-check.mjs
```

#### Step 3: Run Database Migrations (Zero-Downtime Forward Migrations)

```bash
# Connect to PostgreSQL primary (e.g., Supabase / RDS)
psql "$DATABASE_URL" -f supabase/migrations/20260810000001_init.sql
psql "$DATABASE_URL" -f supabase/migrations/20260810000002_phase2_phase3.sql
psql "$DATABASE_URL" -f supabase/migrations/20260810000003_rls_hardening.sql
psql "$DATABASE_URL" -f supabase/migrations/20260810000004_railway_graph_pgvector.sql
```

#### Step 4: Build New Application Container Image

```bash
docker compose -f deploy/docker-compose.prod.yml build web
```

#### Step 5: Rolling Container Restart

```bash
# Start updated container in background
docker compose -f deploy/docker-compose.prod.yml up -d --no-deps --build web
```

#### Step 6: Reload Nginx Reverse Proxy

```bash
docker compose -f deploy/docker-compose.prod.yml exec nginx nginx -s reload
```

---

### Option B: Cloudflare / Vercel + Managed Postgres (Serverless)

```bash
# 1. Trigger production build
vercel --prod

# 2. Or GitHub Actions auto-deploy on release tag
git tag -a v1.0.0 -m "Production Launch Release v1.0.0"
git push origin v1.0.0
```

---

## 3. Post-Deployment Smoke Verification

Immediately following cutover, run the automated smoke test suite:

```bash
# Run against the production domain
node scripts/smoke-test.mjs https://railbandhan.com
```

### Manual Verification Checklist (Sanity Walkthrough)

1. **Health Probe**: Request `GET https://railbandhan.com/api/health` — Verify `{ "status": "ok", "services": { "database": "ok", ... } }`.
2. **Landing & UI**: Load `https://railbandhan.com/` — Verify PWA shell renders, train background video/hero loads.
3. **Session Verification**: Load `https://railbandhan.com/login` — Check CSRF and anonymous onboarding paths.
4. **Active Lounge Check**: Access demo train lounge `12723` (Telangana Express) — Verify recent journey messages load.
5. **Observability Metric Stream**: Request `GET https://railbandhan.com/api/v1/admin/railway-health` with admin token — Ensure provider fallback health scores are 100%.

---

## 4. Emergency Contacts & Escalation

| Role                   | Contact                             | SLA       |
| :--------------------- | :---------------------------------- | :-------- |
| **Incident Commander** | SRE Lead (`sre@railbandhan.com`)    | < 5 mins  |
| **Database Engineer**  | DBA Lead (`dba@railbandhan.com`)    | < 10 mins |
| **Security Officer**   | SecOps (`security@railbandhan.com`) | < 15 mins |
