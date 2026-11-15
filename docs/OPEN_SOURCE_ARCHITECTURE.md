> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# RailBandhan: Open-Source-First & Self-Hosted Architecture

## 1. System Architecture Overview

RailBandhan is designed with a layered, decoupled architecture where foundational storage, authorization, and intelligence reside in self-hosted open-source components.

```
                                  ┌─────────────────────────────────┐
                                  │      Client (Next.js / PWA)     │
                                  │   (Offline Cache + Optimistic)  │
                                  └────────────────┬────────────────┘
                                                   │ HTTPS / WSS
                                                   ▼
                                  ┌─────────────────────────────────┐
                                  │     Reverse Proxy (Caddy/TLS)   │
                                  └────────────────┬────────────────┘
                                                   │
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │               Next.js App Server                │
                          │   (Route Handlers + Domain Engine Services)     │
                          └───────┬───────────────┬─────────────────┬───────┘
                                  │               │                 │
                ┌─────────────────┼───────────────┼─────────────────┼─────────────────┐
                │                 │               │                 │                 │
                ▼                 ▼               ▼                 ▼                 ▼
        ┌──────────────┐  ┌──────────────┐ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  PostgreSQL  │  │ Redis/Valkey │ │ Private S3 / │  │  Local OCR   │  │   Local AI   │
        │   + RLS      │  │ Cache / Sync │ │    MinIO     │  │  (Tesseract/ │  │(Ollama/vLLM/ │
        │  + pgvector  │  │ & Rate Limit │ │ Ticket Vault │  │  Paddle/PDF) │  │ Transformers)│
        └──────────────┘  └──────────────┘ └──────────────┘  └──────────────┘  └──────────────┘
                ▲
                │ Database Authoritative Truth
                ▼
        ┌───────────────────────────────────────────────────────────────────┐
        │            Deterministic Railway Graph & Segment Engine           │
        │      (Station Canonical Catalog + Ordered Route Topologies)       │
        └───────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Data Flows

### 2.1 Ticket Upload, OCR & Verification Flow

```
User uploads Ticket (PDF/Image)
  │
  ├── [PDF?] ───> Check Text Layer ───[Text Exists]───> Direct Stream Parse (No OCR, 0ms GPU)
  │                                                                 │
  └── [Image/Scan] ─────────────────────────────────────────────────┤
          │                                                         │
          ▼                                                         ▼
     Sharp / OpenCV Preprocessing                         Deterministic Token Extractor
     (EXIF strip, Grayscale, Deskew, Binarize)            (Regex normalization, Digit fixing)
          │                                                         │
          ▼                                                         ▼
     Local OCR Engine (Tesseract 5 hin+eng)               Canonical Train & Station Validator
          │                                                         │
          └───────────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
                     Field Confidence Scorer
                     (pnr, train, date, stations, coach, berth)
                                  │
            ┌─────────────────────┴─────────────────────┐
            │                                           │
      [Score >= 0.85]                             [Score < 0.85]
            │                                           │
            ▼                                           ▼
      Instant Confirmation                  User Review & Correction Prompt
            │                                           │
            └─────────────────────┬─────────────────────┘
                                  │
                                  ▼
                     HMAC-SHA256 Hash PNR & Store
                     (Encrypted Ticket Vault in MinIO)
                                  │
                                  ▼
                     Join Journey & Segment Communities
```

### 2.2 Grounded Railway Assistant (Hallucination-Proof RAG)

```
User Query: "When do we reach Nagpur?"
  │
  ▼
Intent Classifier (Deterministic pattern matcher or Qwen2.5-0.5B)
  │
  ▼
Authoritative Data Retrieval
  ├── Active User Journey Membership (User A -> Train 12723, Journey Date)
  ├── Railway Graph Topology (Stop 9: NGP, Scheduled Arrival 15:20)
  └── Telemetry Status Service (Live delay: +18 mins -> ETA 15:38, Platform 3)
  │
  ▼
Prompt Assembly with Strict Delimiters
  [SYSTEM]: "You are RailBandhan Assistant. State ONLY facts from [GROUNDED_DATA]."
  [GROUNDED_DATA]: { "train": "12723", "station": "Nagpur (NGP)", "eta": "15:38", "delay": "18m", "platform": "3" }
  [USER_QUERY]: "When do we reach Nagpur?"
  │
  ▼
Local Model Inference (Qwen2.5-1.5B via Ollama / llama.cpp)
  │
  ▼
Response: "Train 12723 (Telangana Express) is currently running 18 minutes late. Expected arrival at Nagpur (NGP) is 15:38 at Platform 3."
```

---

## 3. Journey Identity & Segment Overlap Mathematics

### 3.1 Immutable Journey Key

A journey instance is uniquely identified by:
$$\text{JourneyKey} = \text{TrainNumber} : \text{ServiceDate} : \text{OriginStation} : \text{DestinationStation}$$

Example: `12723:2026-08-20:SC:NDLS`

### 3.2 Segment Overlap Algorithm

Given an ordered train route graph with stations $S_0, S_1, \dots, S_n$:
A passenger with boarding stop index $u_{\text{start}}$ and destination stop index $u_{\text{end}}$ overlaps a segment community with interval $[c_{\text{start}}, c_{\text{end}}]$ if and only if:
$$\max(u_{\text{start}}, c_{\text{start}}) < \min(u_{\text{end}}, c_{\text{end}})$$

This prevents cross-journey data leakage and guarantees passengers only see chats and discussions for segments they actually traverse.

---

## 4. Realtime Security Architecture

- Realtime channels are namespaced by journey (`journey:<journey_id>:train_wide`, `journey:<journey_id>:segment:<seg_id>`).
- Subscription requests must present a signed session token.
- The server checks `assertCanAccessJourney(userId, journeyId)` before granting subscription. Guessed channel IDs are rejected.
