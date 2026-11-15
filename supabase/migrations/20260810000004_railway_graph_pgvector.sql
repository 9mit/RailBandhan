-- ==============================================================================
-- RAILBANDHAN MIGRATION: PGVECTOR, CANONICAL GRAPH & SEGMENT RLS HARDENING
-- ==============================================================================

-- 1. Enable pgvector for semantic search & embeddings
create extension if not exists vector;

-- 2. Add embedding columns to posts and messages
alter table public.posts
  add column if not exists embedding vector(384);

alter table public.chat_messages
  add column if not exists embedding vector(384);

-- 3. Create HNSW indexes for fast approximate nearest neighbor vector search
create index if not exists idx_posts_embedding_hnsw
  on public.posts
  using hnsw (embedding vector_cosine_ops);

-- 4. Canonical Station Master Table with Geospatial Coordinates
create table if not exists public.railway_canonical_stations (
  code text primary key,
  name text not null,
  hindi_name text,
  aliases text[] not null default '{}',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. Canonical Train Route Master Table
create table if not exists public.railway_canonical_routes (
  train_number text not null,
  station_code text not null references public.railway_canonical_stations(code) on delete cascade,
  stop_index integer not null,
  distance_km integer not null default 0,
  scheduled_arrival time,
  scheduled_departure time,
  primary key (train_number, stop_index)
);

-- 6. Enable RLS on newly created tables
alter table public.railway_canonical_stations enable row level security;
alter table public.railway_canonical_routes enable row level security;

-- Canonical tables are public read-only
create policy "Canonical stations are viewable by all authenticated users"
  on public.railway_canonical_stations for select
  to authenticated, anon
  using (true);

create policy "Canonical routes are viewable by all authenticated users"
  on public.railway_canonical_routes for select
  to authenticated, anon
  using (true);

-- 7. Segment Community Isolation Policy
-- Ensure post access in a segment community requires active overlapping journey membership
create or replace function public.has_segment_overlap(
  p_user_id uuid,
  p_community_id uuid
) returns boolean as $$
declare
  v_journey_id uuid;
  v_is_member boolean;
begin
  select journey_id into v_journey_id
  from public.communities
  where id = p_community_id;

  if v_journey_id is null then
    return false;
  end if;

  select exists (
    select 1 from public.journey_memberships
    where user_id = p_user_id
      and journey_id = v_journey_id
      and status = 'verified'
      and expires_at > timezone('utc'::text, now())
  ) into v_is_member;

  return v_is_member;
end;
$$ language plpgsql security definer;
