> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-008: Private S3-Compatible Object Storage for Ticket Vault

## Context

Raw uploaded ticket PDFs and images must be securely stored with zero public internet access, strict encryption, and automated retention lifecycle purging.

## Decision

Use private S3-compatible object storage (MinIO for self-hosted, Cloudflare R2 / AWS S3 for cloud) with AES-256 server-side encryption and 48-hour automated lifecycle expiration.

## Rationale

- Decouples large binary blobs from relational database storage.
- Presigned URLs with 60-second expiration ensure ticket access is strictly authenticated.
- Automated lifecycle rules guarantee tickets are permanently purged 48 hours after journey completion.
