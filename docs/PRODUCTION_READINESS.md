# Production readiness

Status: **release candidate with explicit launch gates**. Date: 15 November 2026. This checklist supersedes historical “approved” reports.

## Implemented and checked locally

- [x] Responsive application shell and redesigned public/home, discovery, authentication, journey entry, communication hubs and profile experiences.
- [x] Retained journey, community, DM, games, poll, notification and moderation workflows use the consistent design system.
- [x] Supplied images/video inspected and optimized; fabricated activity and badges removed.
- [x] Browser zoom, reduced-motion rules, playback control, labelled forms, skip link, visible focus and native dialogs implemented.
- [x] PostgreSQL driver and shared asynchronous repository implemented; no silent production fallback.
- [x] Opaque session hashes, refresh rotation/reuse revocation and server-side logout implemented.
- [x] Authorization, request schemas/limits, CSRF checks, private API cache policy and nonce CSP checked.
- [x] Ticket extraction uses local native tools; encrypted storage and no plaintext persisted PNR verified.
- [x] Dependency audit reports zero known runtime and development npm vulnerabilities at the recorded check.
- [x] Lint and app/test TypeScript checks pass at the recorded verification.
- [x] Regression/adversarial tests pass, including PostgreSQL-engine behavior and backup encryption integrity.
- [x] Production build observed successfully; final verification results are recorded in the rebuild report.
- [x] Docker, private ingress, CI/release gates, metrics, retention worker, migrations and backup/restore tools supplied.
- [x] Deployment, rollback, monitoring, recovery, architecture, security and performance documentation supplied.

## Required before public traffic

- [ ] Observe the final branch’s GitHub CI result, including the PostgreSQL wire-protocol and production HTTP smoke checks.
- [ ] Build and scan the actual release container; verify Compose startup, native OCR and persistent volume permissions on the target platform.
- [ ] Supply real HTTPS/domain configuration, independent secrets and a least-privilege production database role.
- [ ] Implement verified email ownership, account recovery and privileged MFA, or integrate a maintained identity provider.
- [ ] Configure and validate any live railway provider; keep timetable estimates labelled when no live observation is available.
- [ ] Run full authenticated browser journeys on mobile/tablet/desktop/ultrawide screens, keyboard and screen reader.
- [ ] Complete WCAG 2.2 AA testing, Lighthouse measurements and real-user Core Web Vitals collection.
- [ ] Load-test representative reads/writes and hostile/large upload patterns; establish an evidence-based capacity limit.
- [ ] Isolate OCR appropriately for hostile public uploads and complete independent application security testing.
- [ ] Configure alert routing, moderation responsibilities, certificate monitoring and retention/backup failure alerts.
- [ ] Perform an actual off-host encrypted backup and isolated PostgreSQL restore; record achieved recovery time and recovery point.
- [ ] Rehearse rollback of the exact release image and schema combination.
- [ ] Review age/privacy/retention notices and operational policies with the responsible owner.

## Verification limits

The desktop home and help rendering were inspected. The cloud browser later became unresponsive, preventing further mobile/authenticated UI checks. Docker is not available in this workspace. External production services and credentials were not supplied. No public deployment, independent penetration test, Lighthouse score, 60 FPS result, compliance certification or high-availability guarantee is claimed.
