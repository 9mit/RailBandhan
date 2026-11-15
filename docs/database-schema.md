> Historical document. The 15 November 2026 rebuild is documented in [Architecture review](ARCHITECTURE_REVIEW.md), [Security review](SECURITY_REVIEW.md) and [Production deployment](PRODUCTION_DEPLOYMENT.md). Earlier readiness claims do not apply to this release.

# Database Schema

## Conventions

- All primary keys: `uuid` (`gen_random_uuid()`)
- Timestamps: `timestamptz` with `created_at` / `updated_at`
- Soft delete only where required for moderation audit (`deleted_at`)
- RLS enabled on every user-facing table

## Entity relationship (core)

```text
auth.users 1─1 profiles
auth.users 1─1 anonymous_profiles
trains 1─* journeys
stations referenced by journeys (boarding, destination)
journeys 1─* journey_members (*─1 auth.users)
journeys 1─1 communities (train_wide) + optional segment communities
communities 1─* posts 1─* comments / post_reactions
journeys 1─1 chat_rooms 1─* messages
tickets / ticket_extractions ─* user (owner only)
```

## Tables

### profiles (private identity)

| Column                  | Type                  | Notes        |
| ----------------------- | --------------------- | ------------ |
| user_id                 | uuid PK FK auth.users |              |
| real_name               | text                  | never public |
| age                     | int                   | nullable     |
| gender                  | text                  | nullable     |
| created_at / updated_at | timestamptz           |              |

### anonymous_profiles (public identity)

| Column                  | Type                        | Notes                            |
| ----------------------- | --------------------------- | -------------------------------- |
| user_id                 | uuid PK FK auth.users       |                                  |
| public_handle           | text UNIQUE                 | e.g. Passenger_4821              |
| avatar_url              | text                        |                                  |
| bio                     | text                        |                                  |
| reputation              | int default 0               |                                  |
| discovery_visible       | bool default false          |                                  |
| messaging_policy        | text default `same_journey` | `nobody\|same_journey\|eligible` |
| coach_visibility        | text default `never`        | `never\|coach\|coach_berth`      |
| created_at / updated_at | timestamptz                 |                                  |

### trains

| Column | Type        |
| ------ | ----------- |
| id     | uuid PK     |
| number | text UNIQUE |
| name   | text        |

### stations

| Column | Type        |
| ------ | ----------- |
| id     | uuid PK     |
| code   | text UNIQUE |
| name   | text        |

### train_routes / train_route_stops

Route ordered stops for segment overlap checks (`stop_index`).

### journeys

| Column                 | Type        | Notes                                    |
| ---------------------- | ----------- | ---------------------------------------- |
| id                     | uuid PK     | security identifier                      |
| train_id               | uuid FK     |                                          |
| journey_date           | date        |                                          |
| boarding_station_id    | uuid FK     |                                          |
| destination_station_id | uuid FK     |                                          |
| normalized_key         | text UNIQUE |                                          |
| status                 | text        | `scheduled\|active\|completed\|archived` |
| service_instance_id    | text        | nullable                                 |

### journey_segments

Optional segments for segment communities (`boarding_station_id`, `destination_station_id`, `journey_date`, `train_id`).

### communities

| Column       | Type                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| id           | uuid PK                                                                           |
| journey_id   | uuid FK nullable for train-wide shared across segment journeys of same train+date |
| train_id     | uuid FK                                                                           |
| journey_date | date                                                                              |
| segment_id   | uuid FK nullable                                                                  |
| type         | text                                                                              | `train_wide\|segment`        |
| slug         | text                                                                              | product branding, not Reddit |

Unique: `(train_id, journey_date, type, segment_id)`.

### journey_members

| Column              | Type        | Notes                                 |
| ------------------- | ----------- | ------------------------------------- |
| id                  | uuid PK     |                                       |
| user_id             | uuid FK     |                                       |
| journey_id          | uuid FK     |                                       |
| status              | text        | `pending\|verified\|expired\|revoked` |
| verification_method | text        | `manual\|ticket_extracted`            |
| expires_at          | timestamptz |                                       |
| created_at          | timestamptz |                                       |

**UNIQUE (user_id, journey_id)**

### tickets

Ephemeral metadata: owner, storage_key (nullable after delete), mime, size, scan_status, deleted_at.

### ticket_extractions

Draft/confirmed extracted fields; `pnr_hash` (HMAC); plaintext PNR cleared after confirm; confidence JSON.

### posts / comments / post_reactions

Membership-gated via community → journey membership.

### chat_rooms / messages

One train-wide room per journey community; messages RLS membership-gated.

### blocks / reports

Schema ready; moderation queue UI in Phase 2.

### audit_logs

Actor, action, resource_type, resource_id, metadata (redacted), created_at. No PNR/email in metadata.

## Critical indexes

- `journey_members (user_id, journey_id, status)`
- `posts (community_id, created_at DESC)`
- `messages (room_id, created_at)`
- `journeys (normalized_key)`
- `ticket_extractions (pnr_hash)` where not null

## Retention

See `privacy-retention.md`. Raw ticket objects deleted after confirmation; sensitive extraction fields minimized after journey completion.
