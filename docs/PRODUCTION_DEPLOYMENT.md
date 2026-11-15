# Production deployment and maintenance

This guide describes the implemented application. Do not use the historical Supabase deployment instructions for this release. Public release is conditional on the remaining gates in [production readiness](PRODUCTION_READINESS.md).

## 1. Local development

Requirements: Node.js 24, npm, Poppler and Tesseract. On Debian/Ubuntu, install `poppler-utils` and `tesseract-ocr`. Use your platform’s maintained packages on other operating systems. Manual journey entry works without OCR binaries.

```bash
npm --prefix apps/web ci
cp .env.example apps/web/.env.local
npm run dev
```

Next.js loads `apps/web/.env.local`. SQLite defaults to `apps/web/.data/railbandhan.db`. Documents and the local development vault key stay under `.data`, outside public assets. Do not remove this directory unless you intentionally want to reset a disposable local environment.

Development uses `.next-dev`; production builds use `.next`. Run the standard checks before building. The `dev` wrapper accepts host/port arguments so it works with managed preview environments.

For PostgreSQL development, start the loopback-only services with `docker compose up -d postgres valkey`, set `DATA_STORE=postgres`, and use the development database URL in `.env.example`. Export the URL into your shell before running the migration CLI. The CLI does not automatically load Next.js environment files.

## 2. Configuration and secrets

Copy `.env.production.example` to `.env.production` outside Git. Set the real domain. Generate a separate random value for each secret using a trusted secret manager or `openssl rand -hex 32`. Never put actual values in issue comments, pull requests, container build arguments or frontend variables.

| Variable                               | Purpose and expected value                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Exact canonical HTTPS origin; server metadata and write-origin policy                           |
| `RAILBANDHAN_HOST`                     | The matching hostname, without scheme/path, for Nginx                                           |
| `DATA_STORE`                           | `postgres` in production                                                                        |
| `DATABASE_URL`                         | PostgreSQL URL for the runtime; injected by the supplied Compose stack                          |
| `DATABASE_POOL_SIZE`                   | Per-process connection budget, default 10, maximum 50                                           |
| `DATABASE_SSL`                         | `true` when TLS is required to a local/private-named DB; remote hosts always verify TLS         |
| `DATABASE_CA_FILE`                     | Optional trusted CA PEM path for private managed DB certificates                                |
| `POSTGRES_PASSWORD`                    | Random hex password for the supplied PostgreSQL service                                         |
| `REDIS_PASSWORD`                       | Independent random hex password for the supplied Valkey service                                 |
| `REDIS_URL`                            | Redis-compatible URL; use `rediss://` for an external service; Compose injects the internal URL |
| `PNR_HMAC_SECRET`                      | Independent random secret, at least 32 characters                                               |
| `TICKET_ENCRYPTION_KEY`                | 64 hex characters, representing a random 256-bit vault key                                      |
| `CRON_SECRET`                          | Independent bearer credential for the retention worker                                          |
| `METRICS_SECRET`                       | Independent bearer credential for private metrics scraping                                      |
| `COOKIE_SECURE`                        | `true`; production refuses an explicit `false`                                                  |
| `TRUST_PROXY`                          | `true` only with the supplied private ingress and no public app port                            |
| `TICKET_STORAGE_DIR`                   | Persistent private path, `/data/tickets` in Compose                                             |
| `TICKET_RAW_MAX_AGE_HOURS`             | Abandoned upload limit, default 24                                                              |
| `MEMBERSHIP_EXPIRE_DAYS_AFTER_JOURNEY` | Membership lifetime after journey day, default 2                                                |
| `RAILWAY_DATA_PROVIDER`                | `deterministic`, `railradar` or `opendata`; production rejects mocks                            |
| `RAILRADAR_API_BASE_URL`               | Provider base including `/v1`; default `https://api.railradar.in/v1`                            |
| `RAILRADAR_API_KEY`                    | Provider credential, never sent to the browser                                                  |
| `AI_PROVIDER`                          | `deterministic` by default; optional `ollama`; production rejects mock mode                     |
| `OLLAMA_BASE_URL`                      | Operator-controlled local inference URL if enabled                                              |
| `BACKUP_ENCRYPTION_KEY`                | Separate 64-hex-character backup key, used on the backup host only                              |
| `RESTORE_DATABASE_URL`                 | Isolated recovery database URL, used on the recovery host only                                  |

The runtime validates required production settings. Unsupported database selections never fall back silently. Keep the PNR, vault, backup, job and metrics credentials separate. Retain the vault key until every document encrypted under it has been deleted; retain backup keys for as long as corresponding backups exist.

## 3. Database initialization and upgrades

The source of truth is `apps/web/src/server/store/schema.ts`. `scripts/migrate.mjs` applies it to a clean application database under a transaction/advisory lock and stores its checksum. A changed applied checksum is an error. Future releases must add forward migrations with explicit version IDs; do not edit a migration that has reached production.

```bash
npm run db:migrate
```

For the supplied Compose stack, the one-shot `migrate` service runs before `web` becomes ready. It uses the same release image. Existing users of an earlier experimental Supabase schema need a separately rehearsed export/mapping/import migration. Back up before attempting that transition.

Before importing data from an older prototype, purge legacy plaintext ticket files and raw OCR/PNR metadata, review retained passenger fields, and invalidate old sessions. Do not copy a development vault key or secret into production. The new upload confidentiality tests cover the rebuilt write path; they do not retroactively sanitize an unrelated historical database.

For stricter deployments, use a DDL-capable migration role and a separate runtime role with only required DML privileges. Revoke public schema creation and do not give the web role superuser or role-management privileges. Apply that separation in staging first; the starter Compose topology uses one application database owner and therefore is not the final least-privilege configuration.

## 4. Staging

Use a separate domain, database, cache, ticket volume and secrets. Do not clone real passenger documents into staging. Deploy the exact candidate image and apply migrations. Verify:

1. Registration, onboarding, login, logout, refresh expiry/rotation and account deletion with synthetic accounts.
2. Manual journey creation, valid/invalid upload, review/confirmation and file deletion.
3. Same-journey communication, blocked-user behavior, cross-journey denials, polls, games and moderation restrictions.
4. Redis failure, provider timeout, malformed upload, missing vault permissions and retention failure.
5. Desktop/mobile/keyboard/screen-reader layouts, reduced motion and all loading/error/empty states.
6. Read-only HTTP smoke checks and actual image vulnerability scan.
7. An encrypted backup restored into an isolated database, followed by data and authentication checks.

CI runs lint, app/test TypeScript checks, tests, runtime/development dependency audit, migration and a production-artifact HTTP smoke script. Its PostgreSQL contract uses the actual wire protocol when the service URL is set; local runs use PostgreSQL compiled to WASM. A green local run is not a substitute for observing the remote CI result.

## 5. Build and production launch

Install Docker Engine and the Compose plugin on the target host. Use encrypted disks, a firewall exposing only 80/443, maintained OS patches and a secret manager. Obtain valid TLS certificates for the configured domain and place `fullchain.pem` and `privkey.pem` under `deploy/ssl` with restricted host permissions. The directory and real environment files are ignored by Git.

A version tag triggers the release workflow. It reruns quality gates, builds a container, scans high/critical findings and pushes the scanned artifact to GHCR. It does not deploy a host or alter DNS. Pin the resulting image digest for deployment rather than relying on a mutable tag.

```bash
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml config --quiet
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml pull
docker compose --env-file .env.production -f deploy/docker-compose.prod.yml up -d --no-build
```

Set `RAILBANDHAN_IMAGE` to the reviewed registry image/digest before those commands. For a staging/local container build, use the same Compose file with `build`, then `up -d`. Never use the development Compose file for production. Nginx checks the expected hostname, redirects HTTP to the configured HTTPS host, overwrites forwarded identity headers and applies connection/body/request limits.

Check `docker compose ... ps`, migration exit state, `/api/health`, structured logs and a signed-in synthetic account before routing public traffic. Do not publish `web:3000`, PostgreSQL, Valkey or OCR endpoints directly.

## 6. Backups and disaster recovery

Use managed PostgreSQL point-in-time recovery where possible. The supplied scripts add an encrypted logical backup option and an isolated restore path. They require maintained PostgreSQL client tools on the operator host. Keep those tools at least as new as the database major version.

```bash
npm run db:backup -- /private/backups/railbandhan.rbbackup
npm run db:restore -- /private/backups/railbandhan.rbbackup
```

Export `DATABASE_URL` and `BACKUP_ENCRYPTION_KEY` for backup. Export `RESTORE_DATABASE_URL` and the matching backup key for restore. Keys and passwords stay in child environment variables, not command arguments. The backup uses AES-256-GCM and file mode 0600. Restore authenticates the complete encrypted file before sending data to PostgreSQL, targets only an empty database with `_restore` or `_staging` in its name, uses a single transaction and revokes restored sessions.

Schedule encrypted backups on the operator’s infrastructure and copy them off-host. Alert on stale or failed backups. Rehearse restore monthly and after schema/tool upgrades. Verify row counts, foreign keys, representative journey/chat records, login and session invalidation. Record actual recovery time and recovery-point age. RPO/RTO targets are not proven until that exercise succeeds.

Do not routinely back up raw ticket documents; they are temporary data with a short deletion lifetime. Keep database backup retention and deletion exceptions explicit in the privacy policy. Vault and backup keys need independent off-host recovery protection.

The encryption-format round-trip/tamper test passes. A live `pg_dump`/`pg_restore` disaster-recovery exercise was not run in this workspace.

## 7. Rollback

1. Stop public writes or enter a controlled maintenance window.
2. Inspect the migration version and release compatibility notes. Schema changes must follow expand/contract migration practice.
3. If backward compatible, set `RAILBANDHAN_IMAGE` to the previous reviewed digest and recreate the app/worker, preserving persistent volumes and secrets.
4. Run readiness and synthetic read/write checks before reopening traffic.
5. If schema/data compatibility is broken, restore into an isolated recovery database, validate it, and deliberately switch the database endpoint. Do not blindly reverse migrations or overwrite the original database.
6. Record the incident, recovered point and lost-write window. Retain the failed environment for authorized investigation without exposing passenger data.

## 8. Monitoring and maintenance

`/api/health` and `/api/v1/health` probe the implemented database/rate-limit dependencies. `/api/v1/metrics` requires `METRICS_SECRET` and emits application/database availability, probe duration, uptime and process-memory gauges. Scrape it over the private app network; the public Nginx route returns 404.

Use ingress request count/status/latency logs for error-rate and latency dashboards. Monitor database pool wait/locks, Redis availability/memory, filesystem capacity, native OCR failures/deadlines, certificate expiry, retention success logs and backup age. Configure alerts to a responsible operator. Metrics/log exports do not automatically create a dashboard or page an on-call engineer.

Rebuild patched base images regularly, review Dependabot changes, run dependency/container scans, rehearse restores and inspect access roles. Rotate operational secrets on personnel changes or compromise. PNR/vault/backup key rotations require a data-retention/key-version plan; do not simply discard old keys while retained data still depends on them.

## 9. Scaling

Start with the measured capacity of one app process, not an assumed traffic claim. Use a managed PostgreSQL instance, tune per-process pool size to the total connection budget, and keep rate limits shared. Before multiple app hosts, move temporary documents to private object storage and OCR to isolated workers with a durable queue. Add authorized push transport only after fan-out and authorization tests. Use immutable static asset caching; never cache personalized pages or authenticated API responses at a CDN.
