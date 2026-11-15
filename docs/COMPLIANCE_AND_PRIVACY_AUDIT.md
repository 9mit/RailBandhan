> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan — Privacy, Security & DPDP Act Compliance Audit

**Classification**: Legal & Security Compliance  
**Regulatory Framework**: Digital Personal Data Protection Act, 2023 (DPDP Act — India)  
**Status**: **COMPLIANT & SIGNED OFF**

---

## 1. Compliance Architecture Overview

RailBandhan is architected specifically to meet and exceed the privacy and fiduciary obligations mandated by the Indian **Digital Personal Data Protection Act, 2023 (DPDP Act)** and Indian Railways passenger data confidentiality principles.

```
                           PASSENGER PRIVACY BOUNDARY
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  [Passenger Ticket / PNR] ──► [In-Memory Normalization]                 │
  │                                        │                                │
  │                         ┌──────────────┴──────────────┐                 │
  │                         ▼                             ▼                 │
  │             [HMAC-SHA256 Hash Vault]      [24-Hour Ephemeral Scrub]     │
  │             (Zero-Knowledge Storage)       (File Unlinked via Cron)     │
  │                         │                                               │
  │                         ▼                                               │
  │             [Anonymous Handle Display]                                  │
  │             (e.g., Passenger_Chai42)                                    │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Privacy Principles & Technical Enforcement

### 1. Data Minimization & Anonymous Identity

- **No KYC/Aadhaar Requirement**: Passengers do not need to provide government IDs or phone numbers.
- **Anonymous Handles**: Passengers operate behind randomized, whimsical railway handles (e.g. `Passenger_Chai42`, `BerthChai40`).
- **Profile Redaction**: Real names, ages, seat numbers, and phone numbers are strictly redacted from public serializers.

### 2. Zero-Knowledge PNR Protection

- Indian Railways 10-digit PNR numbers represent sensitive travel itineraries.
- RailBandhan **never stores plaintext PNRs** in persistent database tables.
- PNR numbers are hashed immediately upon ingestion using `HMAC-SHA256(pnr, PNR_HMAC_SECRET)`.
- The raw PNR is discarded from server memory instantly after hash calculation.

### 3. Automated Storage Scrubbing & Retention Limitation

- Raw ticket images and PDFs uploaded for OCR are stored strictly in private buckets.
- An automated retention job (`POST /api/v1/jobs/retention`) runs every 6 hours:
  - Raw ticket binary files older than 24 hours (`TICKET_RAW_MAX_AGE_HOURS`) are permanently unlinked and deleted from storage.
  - Database ticket records have their `storageKey` set to `null` and marked `deletedAt`.
  - Journey memberships are expired 48 hours post-arrival.

### 4. Right to Erasure (DPDP Act Section 12)

- Fully implemented via `DELETE /api/v1/account`.
- The purge pipeline executes:
  1. Permanent deletion of user auth credentials.
  2. Complete deletion of profile data, passenger preferences, and badges.
  3. Deletion of all ticket extractions and private storage assets.
  4. Removal of journey memberships and direct message associations.
  5. Anonymization of existing forum posts (author set to `[Deleted Passenger]`).

### 5. Passenger Safety & Real-time Harassment Prevention

- **In-Journey Passenger Blocking**: Passengers can block abusive users (`POST /api/v1/blocks`), hiding their posts and preventing direct messages.
- **Safety Reporting Pipeline**: Real-time safety report submission (`POST /api/v1/moderation/reports`) with automated escalation to train community moderators.
- **Strict Cross-Journey Segmentation**: Passengers on Train A cannot see, post to, or chat in Train B lounge.

---

## 3. Compliance Sign-Off Matrix

| Requirement                  | DPDP Act Section | Technical Mechanism                             | Verification Test          |  Status  |
| :--------------------------- | :--------------: | :---------------------------------------------- | :------------------------- | :------: |
| **Notice & Consent**         |      Sec 5       | Clear privacy disclaimer on onboarding & upload | UI verified                | **PASS** |
| **Purpose Limitation**       |      Sec 6       | PNR used solely for journey verification        | Verified                   | **PASS** |
| **Storage Limitation**       |     Sec 8(7)     | 24-hr ticket scrub & auto journey expiration    | `retention.test.ts`        | **PASS** |
| **Right to Erasure**         |      Sec 12      | Complete account & ticket asset purge           | `account-deletion.test.ts` | **PASS** |
| **Data Security Safeguards** |     Sec 8(5)     | HMAC-SHA256, HTTPS, AES-256 storage, RLS        | `adversarial-e2e.test.ts`  | **PASS** |
