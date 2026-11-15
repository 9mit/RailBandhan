# Rebuild report

15 November 2026. Source: `9mit/RailBandhan`, base commit `5d72c4a7be63910cc5f9af5f2ad49e97c708ed13`. Local branch: `codex/railbandhan-rebuild`. Application version: `0.2.0`.

## Result

A redesigned application and a substantial engineering/security rebuild are implemented. This is a tested release candidate with explicit public-launch gates. It is not a claim of complete vulnerability elimination, measured 60 FPS, WCAG certification or immediate production readiness.

GitHub reads succeeded, but the connected integration rejected the first Git object upload with HTTP 403, `Resource not accessible by integration`. No remote branch, pull request, release, deployment or change to `main` was made. The handoff contains the complete source, a binary-capable Git patch, reports and deployment instructions. Use [APPLY_REBUILD.md](APPLY_REBUILD.md) to import it into a fresh branch.

## Product and visual work

- Rebuilt the shared navigation, public home, discovery, login/signup, journey entry/upload, live panel, communities, conversation hubs, profile and game match experience. Retained journey detail, confirmation, chat, DM, polls, notifications, onboarding and moderation screens use the shared primitives and updated palette.
- Established warm paper, forest, terracotta and ink tokens, editorial serif headings, architectural arches, responsive spacing and an Indian train travel narrative.
- Inspected all 13 supplied images and the film at its beginning, middle and end. Integrated relevant train-window, station, surreal train, chai, scenic and riverfront artwork. Retained portraits without inventing users.
- Added a cinematic film/dream toggle, playback control, native scroll/reveal motion and reduced-motion/data-saving behavior. Motion uses browser APIs rather than loading several animation/WebGL libraries without a product need.
- Added semantic forms, labelled errors, native dialogs, zoom support, focus treatment, a skip link, route loading/errors and meaningful empty states.
- Removed fabricated passenger activity, presence, earned badges, filename-generated OCR and unlabelled simulated telemetry. Corrected game move payloads and travel category validation. Ludo now has usable dice/token controls.

## Engineering work

- Implemented a real PostgreSQL driver, a shared awaited SQL repository and retained local SQLite/memory implementations. Unsupported configurations fail explicitly. Expanded the local route/station catalog consistently across stores.
- Added checksummed migrations, constraints/indexes, transactions, relevant PostgreSQL row locks, atomic reputation updates, batched reactions, bounded queries, pool limits and execution deadlines.
- Replaced signed cookie-only authentication with persistent hashed opaque sessions, 15-minute access, rotating refresh credentials, reuse revocation, server logout and password-confirmed account deletion.
- Added strict write schemas, bounded request streams, CSRF origin/metadata checks, nonce CSP, trusted-proxy handling, Redis-backed limits, private cache policies, outbound time/size/redirect limits and safer logging.
- Implemented actual local PDF/image extraction, authenticated encryption of temporary documents, private file modes, PNR hashing, confirmation/retention cleanup and extraction resource limits.
- Corrected India-local timetable dating and midnight rollover. APIs preserve source, confidence and observation provenance; timetable estimates are not authoritative GPS observations.
- Updated the test framework to Vitest 5.1.0 and patched development-tool advisories; removed unused Supabase SDKs and the unused React test transform plugin.
- Added a non-root standalone container, private PostgreSQL/Valkey topology, hardened ingress, internal retention worker, health/metrics, pinned CI actions, dependency updates and a scan-gated release artifact workflow.
- Added encrypted backup/isolated restore tooling and local, staging, production, rollback, monitoring, scaling and maintenance documentation.

## Observed verification

| Check                                     | Observed result                   | Boundary                                                                                                         |
| ----------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Baseline tests                            | 22 files, 69 tests passed         | Original checkout                                                                                                |
| Clean lockfile installation               | Passed                            | Final dependencies install using `npm ci` without peer-conflict warnings                                         |
| Final lint                                | Passed                            | Active Next.js source/configuration                                                                              |
| Final app and test TypeScript checks      | Passed                            | Includes root test project                                                                                       |
| Final default-store regression suite      | 28 files, 95 tests passed         | Includes SQLite, PostgreSQL engine, sessions, upload confidentiality, isolation, game logic and backup integrity |
| Memory-store regression suite             | 28 files, 95 tests passed         | PostgreSQL contract runs independently in the same suite                                                         |
| PostgreSQL contract                       | Passed using PGlite               | Real PostgreSQL engine compiled to WASM; wire-protocol CI still pending                                          |
| Production build and standalone packaging | Passed                            | Next.js 15.5.29 / React 19.3.1 / Node.js 24.22.1                                                                 |
| Full npm audit (runtime + development)    | 0 known vulnerabilities           | Snapshot of the full dependency audit after Vitest 5.1.0/tooling updates, not an OS/container scan               |
| Preflight                                 | Passed                            | Runtime version, required files, local native readers, ignored production secrets and local environment policy   |
| Operational scripts and YAML              | Parsed successfully               | Static syntax checks do not prove container startup                                                              |
| Desktop browser review                    | Home and help/navigation observed | Further browser work became unavailable; mobile/authenticated journeys unverified                                |
| GitHub publication                        | Blocked by integration 403        | No remote CI or PR result claimed                                                                                |

The PostgreSQL contract checks normalized persistence, complete catalog loading, hashed sessions/atomic refresh history and transaction rollback. Security tests check session revocation/replay, request bounds/types, CSRF/CSP, redirect safety, upload encryption/tamper handling and cross-journey isolation. These tests supplement rather than replace independent security testing.

## Measured performance

| Item                 |         Original |                                      Rebuilt |
| -------------------- | ---------------: | -------------------------------------------: |
| Supplied image set   | 11,595,966 bytes |       1,637,576 bytes in WebP, 85.9% smaller |
| Train film           |  5,225,135 bytes |               1,307,720 bytes, 75.0% smaller |
| Home first-load JS   |     Not measured | Approximately 118 kB in the production build |
| Shared first-load JS |     Not measured | Approximately 103 kB in the production build |

Original artwork remains in the source archive; application references use the compressed derivatives. Build JS estimates are not Lighthouse or real-user measurements. No Core Web Vitals result or frame-rate result is claimed.

## Launch gates and remaining architecture recommendations

1. Publish the branch through a GitHub connection with repository content write permission, observe its actual PostgreSQL/Redis CI and production HTTP smoke results, and build/scan the release container.
2. Configure a real domain, HTTPS, independent secrets, durable storage and separate least-privilege database roles. The starter Compose database owner is not the final privilege separation.
3. Implement verified email ownership, account recovery and privileged MFA, or connect a maintained identity provider. These features are not implemented by this rebuild.
4. Verify any live railway provider with real credentials. OCR and manual journey entry remain self-declared membership, not verification by Indian Railways.
5. Complete authenticated browser journeys across mobile/tablet/desktop/ultrawide, keyboard and screen reader. Measure contrast, WCAG 2.2 AA, Lighthouse and real-user CWV before claiming compliance.
6. Isolate hostile OCR workloads, load-test representative traffic, complete an independent security assessment and establish a measured capacity limit.
7. Configure alert routing and moderation operations. Perform a real off-host encrypted PostgreSQL backup/restore and exact-image rollback rehearsal.
8. Before multiple app hosts, move temporary documents to private object storage and extraction to a durable isolated worker queue. Current communication uses polling; older-feed pagination, normalized poll/game records and authorized push transport are future improvements.

## Document map

- [Implementation plan](REBUILD_PLAN.md)
- [Architecture review and recommendations](ARCHITECTURE_REVIEW.md)
- [Security findings and controls](SECURITY_REVIEW.md)
- [Performance findings and measurement plan](PERFORMANCE_REVIEW.md)
- [Design system and assets](DESIGN_SYSTEM.md)
- [Deployment, environment, rollback and recovery guide](PRODUCTION_DEPLOYMENT.md)
- [Production-readiness checklist](PRODUCTION_READINESS.md)
- [Every-file inventory and review coverage](FILE_REVIEW.md)
- [Importing the handoff](APPLY_REBUILD.md)

Historical prototype reports and Supabase experiments are retained with superseded notices. They do not describe the current deployment contract.
