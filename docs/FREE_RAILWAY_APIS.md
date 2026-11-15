> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# Free & Community Indian Railways APIs Guide

This document provides a comprehensive guide to free, community-maintained, and open-source APIs and datasets for Indian Railways (stations, trains, routes, live running status, and PNR data) discovered from Reddit communities (e.g. `r/developersIndia`, `r/IndianRailways`), GitHub repositories, and open data platforms.

---

## 1. Executive Summary & Architecture Strategy

Official Indian Railways APIs from CRIS (Centre for Railway Information Systems) / IRCTC are restricted to commercial B2B partners under TIES agreements and are not publicly available for free developer usage.

To overcome this, **RailBandhan** uses a **Multi-Tier Resilient Provider Strategy**:

1. **Tier 1 (Deterministic Local Offline Graph)**: Bundled canonical railway stations (with Hindi names, coordinates, and aliases) and train route topologies. Zero latency, 100% offline uptime, zero cost.
2. **Tier 2 (Free Community APIs & Scrapers)**: Live telemetry fetched from community projects (RailCore, RailRadar, RailKit) or Freemium RapidAPI endpoints.
3. **Tier 3 (Local SQLite Caching)**: All queried stations, train routes, and live statuses are cached in local SQLite to prevent rate limiting and provide instant offline experiences.

---

## 2. Top Community Projects & Free APIs (Reddit & Developer Forums)

### 2.1 RailCore

- **Website / Docs**: `railcore.tech`
- **Source**: Highlighted on `r/developersIndia` & `r/IndianRailways`.
- **Capabilities**:
  - PNR Status verification & seat prediction
  - Live train running status & current station delay
  - Train schedule & route stops
  - Live station departures/arrivals board
- **Pricing**: Free developer playground and API access.
- **Integration in RailBandhan**:
  ```env
  RAILWAY_PROVIDER=railcore
  ```

### 2.2 RailRadar

- **Website / Docs**: `railradar.in`
- **Source**: "FlightRadar24 for Indian Trains" - widely featured across Indian tech communities.
- **Capabilities**:
  - Live geospatial train coordinates and delay tracking
  - Visual route progression
  - Active train telemetry feeds
- **Pricing**: Open access for hobbyists and developers.
- **Integration in RailBandhan**:
  ```env
  RAILWAY_PROVIDER=railradar
  ```

### 2.3 RailKit

- **Website / Docs**: `railkit.rajivdubey.dev`
- **Source**: Open-source developer project.
- **Capabilities**:
  - Live tracking
  - Station search and trains between stations
  - PNR status check
- **Pricing**: Open developer tier.

---

## 3. Open-Source Static Datasets (GitHub)

### 3.1 DataMeet Railways (`datameet/railways`)

- **Repository**: [github.com/datameet/railways](https://github.com/datameet/railways)
- **License**: Open Data Commons Open Database License (ODbL) / CC-BY
- **Included Data**:
  - **Stations**: Complete GeoJSON list of >8,000 Indian railway stations with station codes, English/Hindi names, zones, divisions, and geographic coordinates.
  - **Schedules**: Static routes and stops for express, superfast, passenger, and suburban trains.
- **Best Use**: Seeding local SQLite database tables (`railway_canonical_stations` and `railway_canonical_routes`) for offline station lookups and route validation.

### 3.2 RailPull / NTES Crawler (`shwetankg07/railpull`)

- **Repository**: [github.com/shwetankg07/railpull](https://github.com/shwetankg07/railpull)
- **Capabilities**: Automated tools to fetch, clean, and export official NTES timetables into structured CSV/JSON formats.
- **Best Use**: Keeping train timetable schedules updated periodically in batch.

---

## 4. RapidAPI Freemium Indian Railway Providers

Several developers on RapidAPI host IRCTC/NTES wrappers offering free monthly tiers:

| RapidAPI Service                  | Free Quota             | Endpoints                                                     |
| --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| **IRCTC / Indian Railway API**    | 100–500 requests/month | `/getLiveTrainStatus`, `/getTrainSchedule`, `/checkPNRStatus` |
| **Indian Railways Live Tracking** | 50 requests/day        | `/live-status`, `/station-search`                             |

**Configuration**:

```env
RAILWAY_PROVIDER=rapidapi
RAILWAY_API_KEY=your_rapidapi_key_here
```

---

## 5. Local SQLite Database Configuration

To toggle between local SQLite database and production PostgreSQL/Supabase:

### Local Development / Testing (SQLite)

In `apps/web/.env.local`:

```env
DATA_STORE=sqlite
SQLITE_DB_PATH=.data/railbandhan.db
RAILWAY_PROVIDER=mock # or railcore / deterministic
```

### In-Memory Testing (Ultra-fast ephemeral Vitest runs)

```env
DATA_STORE=memory
```

### Production Deployment (Supabase / PostgreSQL)

```env
DATA_STORE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.your-project-id:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
RAILWAY_PROVIDER=deterministic
```
