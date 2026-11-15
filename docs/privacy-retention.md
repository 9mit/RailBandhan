> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# Privacy & Data Retention

## Principles

- Data minimization
- Privacy-preserving defaults
- Separate auth identity from public anonymous identity
- Never show tickets or PNR to other passengers

## Retention policy (configurable via env)

| Data                                        | Default policy                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Raw ticket object                           | Delete immediately after successful confirm (or max 24h if abandoned)                 |
| Plaintext PNR / seat / coach in extractions | Clear after confirm; keep `pnr_hash` for abuse detection until journey archived + 30d |
| Journey membership                          | Retain until account deletion or retention job after archive                          |
| Posts / comments / chat                     | Retain per community policy; anonymize author on account delete                       |
| Private profile                             | Delete on account delete                                                              |
| Audit logs                                  | 90 days; redacted payloads                                                            |
| Train status cache                          | Redis TTL 60–120s                                                                     |

Env knobs:

```text
TICKET_RAW_MAX_AGE_HOURS=24
PNR_HASH_RETENTION_DAYS=30
AUDIT_LOG_RETENTION_DAYS=90
MEMBERSHIP_EXPIRE_DAYS_AFTER_JOURNEY=2
```

## Consent (ticket upload)

Shown before upload:

> Your ticket may contain sensitive information. We only use it to identify your journey. Your ticket will not be shown to other passengers. We delete the file after processing unless you opt in to save it (not offered in MVP).

## Account deletion

Deletes or anonymizes: profiles, anonymous profile, tickets, extractions, memberships, sessions, notifications; posts/comments/messages author fields set to `[deleted]` where content retained for community continuity.

## Logging redaction

Never log: PNR, full name, email, phone, address, payment data, raw OCR text containing those fields.
