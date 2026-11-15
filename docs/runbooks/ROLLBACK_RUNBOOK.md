> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Production Rollback Runbook

**Classification**: Emergency Procedures / SRE  
**Scope**: Immediate service restoration upon critical deployment defect or degradation

---

## 1. Rollback Decision Triggers (Automatic Bailout)

Any of the following criteria observed within 15 minutes of deployment triggers an immediate rollback:

1. **HTTP Error Rate**: `5xx` error rate exceeds `0.5%` across any 3-minute sliding window.
2. **Health Check Failure**: `/api/health` reports status `"degraded"` or `"error"`.
3. **P95 Latency Spike**: P95 latency exceeds `500ms` for core API routes (`/api/v1/journeys`, `/api/v1/home/feed`).
4. **Auth Failure**: Login, session minting, or token verification failure rate exceeds `1%`.
5. **Data Isolation Breach**: Any reported cross-journey data leakage or unauthorized access log.

---

## 2. Immediate Rollback Execution Sequence

### Phase 1: Revert Traffic (Container Stack)

#### Step 1: Rollback Container Image to Previous Tag

```bash
# Set PREVIOUS_TAG from the pre-deployment deployment record
export PREVIOUS_TAG=v0.9.8

# Point web image back to previous immutable tag
docker tag railbandhan/web:${PREVIOUS_TAG} railbandhan/web:latest

# Force recreate container with prior image
docker compose -f deploy/docker-compose.prod.yml up -d --no-deps --force-recreate web
```

#### Step 2: Flush CDN & Ingress Cache

```bash
# Invalidate edge assets
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CF_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```

---

### Phase 2: Serverless / Vercel Rollback

If deploying via Vercel:

```bash
# Promote previous stable deployment instantly
vercel rollback [DEPLOYMENT_URL_OR_ID] --yes
```

---

## 3. Database Migration Rollback Strategy

**Rule of Thumb**: Schema additions (new columns, indexes, non-breaking tables) **never** require down migrations.

If a destructive migration was applied:

1. Stop writing traffic to affected tables via feature flag or maintenance banner.
2. If Point-in-Time Recovery (PITR) is required:
   ```bash
   # Restore PostgreSQL to transaction timestamp immediately preceding migration
   supabase db restore --target-time "2026-10-29 15:30:00+00"
   ```

---

## 4. Post-Rollback Verification

1. Run automated smoke tests:
   ```bash
   node scripts/smoke-test.mjs https://railbandhan.com
   ```
2. Monitor real-time logs for 15 minutes:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml logs -f --tail=200 web
   ```
3. Issue an Incident Resolution notification on Slack `#war-room`.
4. Convene a post-mortem review within 24 hours.
