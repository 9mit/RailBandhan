> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](../ARCHITECTURE_REVIEW.md), [Security review](../SECURITY_REVIEW.md) and [Production deployment](../PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# ADR-003: Local-First Hybrid OCR & Document Processing Pipeline

## Context

Ticket processing must extract structured fields (PNR, train number, date, stations, coach, berth) without sending unredacted passenger ticket images to third-party vision APIs.

## Decision

Implement a multi-tier hybrid pipeline:

1. **Tier 0**: Direct PDF text layer stream extraction for digital ERS tickets.
2. **Tier 1**: Local image preprocessing (Sharp/OpenCV) + Tesseract 5 (`eng+hin`) with deterministic token extraction.
3. **Tier 2**: Self-hosted PaddleOCR / docTR service for degraded scans.
4. **Tier 3 (Optional)**: Local Vision-Language Model (Qwen2-VL-2B) for complex unstructured photographs.

## Rationale

- 90%+ of tickets are standard IRCTC PDFs where Tier 0 extracts text in < 5ms with 100% accuracy.
- Zero PII leaks to external cloud providers.
- Works offline and without GPU requirements.

## Consequences

- Requires Sharp and Tesseract binary/WASM in container.
- Field-level confidence scores trigger manual review when quality is uncertain.
