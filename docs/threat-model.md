> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# Threat Model

## Assets

- Auth credentials / sessions
- Real identity (name, email, phone)
- Ticket images/PDFs, PNR, seat/coach
- Journey membership graph
- Chat, posts, DMs (future)
- Moderation reports

## Adversaries

- Curious passenger probing other trains
- Ticket thief uploading stolen PNRs
- Bot / spam accounts
- Malicious file uploader
- Insider with stolen service key (mitigate via rotation, least privilege)

## Threats & mitigations

| Threat                        | Mitigation                                                             |
| ----------------------------- | ---------------------------------------------------------------------- |
| IDOR / cross-community access | RLS + `requireVerifiedMembership` on every journey-scoped API/Realtime |
| Ticket theft / reuse          | PNR HMAC duplicate detection; rate limits; no plaintext PNR retention  |
| PNR leakage in logs           | Redacting logger; never log extraction raw text in prod                |
| WebSocket room guessing       | Private channels; membership check before join                         |
| User enumeration              | No `GET /users`; search scoped to eligible communities                 |
| Malicious uploads             | MIME sniff, size limits, scan hook, EXIF strip for post images         |
| OCR spoofing / wrong train    | Catalog validation; user confirmation mandatory                        |
| Fake membership flooding      | Rate limits, CAPTCHA hook, per-user journey caps                       |
| XSS                           | React escaping, CSP headers, sanitized markdown if added               |
| CSRF                          | SameSite cookies; Supabase auth patterns                               |
| SSRF                          | No user-controlled fetch URLs in server                                |
| Session hijacking             | Secure cookies, HTTPS, short sessions                                  |
| Tracking individuals          | No GPS; no seat exposure by default; no passenger manifest             |

## Privacy threat model

Assume attacker wants who is on a train, boarding/alighting, seat, identity, phone, PNR, movement.

By design we:

- Never expose full passenger manifests
- Never expose exact GPS or seat by default
- Never show tickets to other passengers
- Show only aggregate online counts in Phase 1

## Mandatory security test

Users A,B on Journey X; User C on Journey Y:

- A can access X posts/chat with B
- A cannot access Y posts/chat, cannot message C (Phase 2), cannot subscribe to Y channels
