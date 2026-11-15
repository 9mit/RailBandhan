# Indian Railway Data Sources: Open-Source & Legal Audit

## 1. Executive Summary
This document provides a comprehensive research evaluation of public, open-source, and community-curated Indian Railway data sources. The objective is to construct a canonical internal railway graph (`RailwayDataRepository`) without violating terms of service or relying on fragile unauthorized web scraping.

---

## 2. Comprehensive Source Evaluation Matrix

| Source Name | Data Scope | License / Legal Status | Redistribution Rights | Update Frequency | Accuracy / Coverage | Recommended Ingestion Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **National Open Data Portal (data.gov.in)** | Station codes, basic train schedules, route geometries | Government Open Data License - India (GODL) | Full commercial & non-commercial with attribution | Annual / Semi-annual | High for static routes (~8,000+ stations) | Primary baseline for static station and train catalog |
| **OpenStreetMap (OSM) Railway Network** | Railway tracks, electrification, station coordinates, junction nodes | Open Database License (ODbL) 1.0 | Share-Alike with ODbL attribution | Continuous community updates | Excellent for spatial coordinates & route distance | Spatial enrichment for station lat/long and route interpolation |
| **Indian Railways Public Timetable (IRCTC/NTES public PDFs & dumps)** | Official schedule, stops, distances, days of run | Public domain / Crown copyright (statutory public notices) | Informational reference | Seasonal (typically biannual) | Ground truth for route sequences | Periodic ingestion pipeline into canonical SQLite/Postgres catalog |
| **Community Open Transit GTFS Feeds** | Suburban rail (Mumbai Local, Chennai Suburban, Delhi Metro/EMU) | Creative Commons (CC-BY 4.0 / Open Data) | Unrestricted with attribution | Monthly | High for suburban networks | Suburban segment routing engine |
| **Commercial APIs (Railofy, RapidAPI IRCTC wrappers)** | Live running status, PNR status, live station boards | Proprietary commercial terms ($0.005 - $0.02 / call) | Real-time query only, caching restricted | Real-time | Variable (scraped upstream proxies) | **Optional fallback only** (circuit-breaker isolated, default disabled) |

---

## 3. Legal & Compliance Guardrails
1. **No Automated Scraping of NTES/IRCTC Captcha Gateways**:
   - Scraping authenticated consumer portals violates IRCTC terms and risks IP bans and legal exposure under the IT Act.
   - All static schedules and station coordinates are derived from open datasets and public timetable releases.
2. **Deterministic Offline Route Engine**:
   - The graph topology (station sequence, segment overlapping, transit time approximations) is calculated strictly locally using our internal graph database.
3. **Telemetry & Live Status Isolation**:
   - Live telemetry status is abstracted behind `TrainDataProvider`. In local/dev, the engine uses the internal simulation provider (`MockTrainDataProvider`). In production, an authorized provider or static timetable progression is used.

---

## 4. Canonical Internal Domain Schema

External railway data must always be normalized into our strict canonical schema before touching the application:

```typescript
export interface Station {
  id: string;
  code: string;        // Canonical uppercase alphanumeric code (e.g. 'NDLS', 'SC')
  name: string;        // Canonical English display name
  hindiName?: string;  // Canonical Devanagari display name
  aliases: string[];   // Common variants, typos, former names (e.g. ['BOMBAY VT', 'VT'])
  latitude?: number;
  longitude?: number;
  division?: string;
  zone?: string;
}

export interface Train {
  id: string;
  number: string;      // 5-digit normalized train number
  name: string;        // Primary operational name
  type: 'Rajdhani' | 'Shatabdi' | 'Vande Bharat' | 'Superfast' | 'Express' | 'Passenger' | 'Suburban';
  originStationCode: string;
  destinationStationCode: string;
  runsOnDays: number[]; // 0=Sunday..6=Saturday
}

export interface TrainRouteStop {
  routeId: string;
  trainId: string;
  stationCode: string;
  stopIndex: number;   // Zero-indexed monotonic sequence
  distanceFromOriginKm: number;
  scheduledArrival: string | null;   // HH:mm format
  scheduledDeparture: string | null; // HH:mm format
  dayCount: number;    // Day of journey (1, 2, 3)
}
```

---

## 5. Architectural Principle
The application layer must NEVER communicate with raw external railway APIs. It must only interact with `RailwayDataRepository`.
