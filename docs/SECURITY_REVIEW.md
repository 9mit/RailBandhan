# Security review

15 November 2026. Source review and automated adversarial/regression checks, aligned with OWASP application security concerns. This is not an independent penetration test or a guarantee that all vulnerabilities have been eliminated.

## Findings and changes

| Severity | Baseline finding                                                                | Implemented change                                                                                      | Evidence                                                   |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| High     | Logout only removed a browser cookie; copied signed credentials remained valid  | Persistent opaque sessions, server-side revocation and account-wide cleanup                             | Session lifecycle/reuse regression tests                   |
| High     | No rotating refresh lifecycle                                                   | 15-minute access cookies, one-use rotating refresh tokens, consumed-token history and family revocation | Rotation, replay and separate-device tests                 |
| High     | PostgreSQL/Supabase selection silently used SQLite                              | Real PostgreSQL adapter; unsupported modes and missing migrations fail clearly                          | PostgreSQL engine contract and migration checks            |
| High     | Filename-based OCR generated fake PNR, date and coach details                   | Real native extraction; no filename fallback or client-supplied OCR trust                               | Valid PDF and invalid PDF tests                            |
| High     | Plain PNR could enter raw extraction metadata                                   | Persist only HMAC of PNR and minimal extraction provenance                                              | Confidentiality test inspects persisted extraction         |
| High     | Private raw documents were plaintext files                                      | AES-256-GCM vault, private modes, random server filenames and cleanup                                   | Encryption/tamper and confirmation-deletion tests          |
| High     | Request bodies and primitive types were weakly checked                          | Route-specific Zod schemas, streaming JSON/multipart limits, bounded decode/output                      | Malformed/oversized request tests                          |
| High     | Loopback-looking rate keys bypassed intended limits                             | No loopback exception; shared Redis counters; explicit proxy trust; bounded local development buckets   | Limit/proxy tests; production Redis gate                   |
| High     | Access/refresh/deletion needed stronger lifecycle controls                      | HttpOnly/Secure/SameSite cookies; password reauthentication and limit before deletion                   | Session tests and account endpoint review                  |
| Medium   | Static CSP allowed eval and inline scripts in production                        | Per-request script nonce; no production eval; object/frame restrictions                                 | Middleware CSP tests and production build                  |
| Medium   | CSRF and forwarded-address trust were loose                                     | Origin/Fetch Metadata checks; JSON content types; ingress overwrites forwarding headers                 | HTTP trust boundary tests                                  |
| Medium   | AI query could accept an explicit unrelated journey                             | Membership check before reading journey data; honest estimate provenance                                | Existing cross-journey tests and service review            |
| Medium   | Presence, activity, badges and fallback telemetry were presented as real        | Remove invented widgets/indicators; fetch earned badges; preserve source/confidence through API         | UI/source review and timetable tests                       |
| Medium   | Concurrent state changes could overwrite game/poll state                        | Transactions and PostgreSQL row locks for relevant reads/updates                                        | Game regressions and SQL adapter contract                  |
| Medium   | Ingress used mutable untrusted cookie values as rate identities                 | IP edge limits plus validated-user limits in Redis                                                      | Nginx template review                                      |
| Medium   | Deployment lacked durable application storage and exposed unused infrastructure | Actual PostgreSQL, private ticket volume, authenticated internal jobs, no unused MinIO service          | Compose/Docker source checks; runtime scan remains pending |
| Medium   | Health advertised unprobed auth/realtime/storage as healthy                     | Check implemented database/rate-limit dependencies; remove invented health claims                       | Readiness regression test                                  |
| Medium   | Logs could retain token-like values and request query strings                   | Expand redaction; operational ingress log format omits queries/cookies/referrers                        | Logger/config review                                       |
| Medium   | Build and development outputs interfered with each other                        | Separate `.next` and `.next-dev` output directories                                                     | Build/preview review                                       |
| Medium   | Runtime environment files could be committed                                    | Ignore `.env.production` and other secret-bearing files; preflight verifies it                          | `git check-ignore` and preflight                           |

## Controls and limits

- SQL values are parameterized. Dynamically selected columns and tables are application-owned constants, not user SQL.
- React renders user text as text. The former inline HTML theme script was removed. CSP adds a second layer; it does not replace output encoding.
- Authentication uses opaque random credentials because this first-party browser application does not need self-contained JWTs. Hashes are persisted; raw credentials are not logged or stored in browser JavaScript. JWT-specific algorithms, issuer/audience checks and bearer-token storage are therefore not applicable to this flow.
- Passwords use salted scrypt and constant-time comparison. Input length is bounded. Nonexistent-user login also performs password work. New accounts require at least 12 characters.
- Rate-limit backend failures fail closed for protected operations. No Redis credentials or raw rate-limit identities are written to logs.
- External provider requests have deadlines, bounded response bodies and disabled redirects. User-supplied avatar URLs are restricted to local image assets. Model/provider endpoints are operator configuration, not arbitrary request destinations.
- Uploads are stored outside the public directory. An 8 MB file limit and 9 MB multipart envelope limit apply. Image decode has a pixel limit. Native OCR is limited to two active jobs per process and a 20-second deadline.
- A ticket’s `scanStatus` remains pending; parsing is not falsely labelled a clean malware scan.
- Operational APIs require independent bearer secrets. Nginx does not expose retention or metrics publicly.

## Dependency result

The full npm dependency audit, including development tools, returned **zero known vulnerabilities** after updating Next.js to 15.5.29, React/React DOM to 19.3.1, Zod to 4.6.7, Vitest to 5.1.0, and patching transitive tooling/PostCSS/source-map dependencies. The broader check found and cleared 13 development-tool findings after the separate production audit was already clear. Unused Supabase SDKs and the unused React test transform plugin were removed. This describes the audit database at the time of the check, not future immunity. CI repeats the check and Dependabot proposes updates.

The TypeScript ESLint parser/plugin stay on 8.72.2 for ESLint 9 compatibility. A scoped `minimatch` 11.0.1 override avoids the transitive glob denial-of-service advisory without downgrading the parser to an incompatible peer version. Reassess these overrides when upstream dependencies incorporate the fix. A clean lockfile installation and lint/type/test checks validate this toolchain.

Release images are gated by a Trivy high/critical scan. That image scan was configured but could not be executed locally because this workspace has no Docker runtime. Native OS package security is a separate concern from the npm result.

## Required before a public launch

1. Configure a maintained email verification/recovery flow and MFA for privileged operators, or a suitable identity provider. Current local authentication has no recovery or verified email ownership.
2. Validate the external railway provider contract with real credentials. No authoritative ticket-verification service is connected.
3. Run native OCR in an independently isolated, resource-constrained worker before accepting hostile public upload volumes; add malware scanning if your operational policy requires it.
4. Run the actual container scan, PostgreSQL wire-protocol CI, authenticated HTTP journeys and Redis failure tests in staging. The local PostgreSQL contract uses a real engine compiled to WASM.
5. Complete keyboard/screen-reader/mobile accessibility checks and independent security testing, including tenant isolation, session races, CSRF, upload fuzzing, proxy configuration and authorization regression.
6. Install real HTTPS certificates, secret management, least-privilege database roles, off-host encrypted backups, alert routing and a staffed moderation process.
7. Review privacy notices, age policy, retention, data-subject requests and backup retention with the responsible operator. No legal compliance certification is claimed.

Residual tradeoffs include inline CSS permission for framework/component styles, polling rather than authenticated push transport, bounded feeds without older-page pagination, JSON-backed poll/game state and a local ticket vault. See the architecture review for the capacity plan.
