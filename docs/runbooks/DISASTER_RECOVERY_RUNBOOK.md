> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Disaster Recovery & Business Continuity Runbook

**Classification**: Infrastructure / Business Continuity  
**Recovery Targets**:

- **Recovery Point Objective (RPO)**: ≤ 15 minutes (maximum permissible data loss window)
- **Recovery Time Objective (RTO)**: ≤ 45 minutes (maximum permissible downtime during catastrophe)

---

## 1. Disaster Scenarios & Mitigation Strategies

| Scenario                                             | Impact                                 | Primary Recovery Mechanism                                           |
| :--------------------------------------------------- | :------------------------------------- | :------------------------------------------------------------------- |
| **Primary Cloud Zone Outage (ap-south-1)**           | Data center unavailable                | Secondary region failover (ap-southeast-1 Singapore or eu-central-1) |
| **PostgreSQL Database Corruption / Dropped Data**    | Data loss or corruption                | Point-in-Time Recovery (PITR) via continuous WAL archiving           |
| **Valkey / Redis Cache Crash**                       | Session/rate limit ephemeral data lost | Auto-restart container; persistent AOF sync; cold bootstrap          |
| **Storage Vault Disruption (Cloudflare R2 / MinIO)** | Ticket image uploads inaccessible      | Secondary replica bucket sync via S3 Cross-Region Replication (CRR)  |

---

## 2. PostgreSQL Point-In-Time Recovery (PITR)

### Continuous WAL Archiving Architecture

Production PostgreSQL instances are configured with continuous Write-Ahead Log (WAL) archiving to encrypted cold object storage (`s3://railbandhan-wal-backups/`).

### Step-by-Step Recovery Procedure:

1. Identify target recovery timestamp (e.g. 5 minutes before corruption event):

   ```bash
   TARGET_RECOVERY_TIME="2026-10-29 14:15:00 UTC"
   ```

2. Provision clean PostgreSQL host or clone primary standby:

   ```bash
   supabase db restore --target-time "$TARGET_RECOVERY_TIME"
   ```

3. Update `DATABASE_URL` in environment secrets vault:

   ```bash
   export DATABASE_URL="postgresql://user:pass@restored-host:5432/railbandhan"
   ```

4. Run schema integrity verification and test train catalog availability:

   ```bash
   psql "$DATABASE_URL" -c "SELECT count(*) FROM trains;"
   ```

5. Point web containers to restored database and restart web tier.

---

## 3. Ephemeral Cache (Valkey / Redis) Cold Recovery

Valkey stores transient rate-limiting keys and active lounge presence. In the event of catastrophic data loss:

1. Restart Valkey with an empty dataset.
2. The application is resilient by design:
   - Rate limiters reset gracefully to zero.
   - User sessions persist in signed JWT/HMAC session cookies (`railbandhan_session`), surviving cache flushes without user logouts.
   - Live presence automatically rebuilds as connected clients send heartbeats.

---

## 4. Disaster Recovery Drill Schedule

To ensure operational readiness, bi-annual DR simulations must be executed:

- **H1 Drill**: Simulated PostgreSQL primary failover and WAL playback.
- **H2 Drill**: DNS rerouting drill to fallback infrastructure.
