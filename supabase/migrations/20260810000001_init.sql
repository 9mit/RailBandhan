-- RailBandhan Phase 1 schema + RLS
create extension if not exists "pgcrypto";

-- Private identity
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  real_name text not null,
  age int check (age is null or (age >= 13 and age <= 120)),
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public anonymous identity
create table public.anonymous_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  public_handle text not null unique,
  avatar_url text,
  bio text,
  reputation int not null default 0,
  discovery_visible boolean not null default false,
  messaging_policy text not null default 'same_journey'
    check (messaging_policy in ('nobody', 'same_journey', 'eligible')),
  coach_visibility text not null default 'never'
    check (coach_visibility in ('never', 'coach', 'coach_berth')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trains (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.train_routes (
  id uuid primary key default gen_random_uuid(),
  train_id uuid not null references public.trains (id) on delete cascade,
  unique (train_id)
);

create table public.train_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.train_routes (id) on delete cascade,
  station_id uuid not null references public.stations (id),
  stop_index int not null,
  unique (route_id, stop_index),
  unique (route_id, station_id)
);

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  train_id uuid not null references public.trains (id),
  journey_date date not null,
  boarding_station_id uuid not null references public.stations (id),
  destination_station_id uuid not null references public.stations (id),
  normalized_key text not null unique,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'active', 'completed', 'archived')),
  service_instance_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journey_segments (
  id uuid primary key default gen_random_uuid(),
  train_id uuid not null references public.trains (id),
  journey_date date not null,
  boarding_station_id uuid not null references public.stations (id),
  destination_station_id uuid not null references public.stations (id),
  unique (train_id, journey_date, boarding_station_id, destination_station_id)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  train_id uuid not null references public.trains (id),
  journey_date date not null,
  journey_id uuid references public.journeys (id) on delete set null,
  segment_id uuid references public.journey_segments (id) on delete set null,
  type text not null check (type in ('train_wide', 'segment')),
  slug text not null,
  created_at timestamptz not null default now(),
  unique (train_id, journey_date, type, segment_id)
);

create table public.journey_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'expired', 'revoked')),
  verification_method text not null
    check (verification_method in ('manual', 'ticket_extracted')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, journey_id)
);

create index journey_members_user_journey_status_idx
  on public.journey_members (user_id, journey_id, status);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_key text,
  mime_type text not null,
  byte_size int not null,
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'clean', 'rejected', 'error')),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ticket_extractions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'confirmed', 'rejected')),
  train_number text,
  train_name text,
  journey_date date,
  boarding_station_code text,
  destination_station_code text,
  coach text,
  berth text,
  travel_class text,
  pnr_hash text,
  confidence jsonb not null default '{}'::jsonb,
  raw_fields jsonb not null default '{}'::jsonb,
  journey_id uuid references public.journeys (id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ticket_extractions_pnr_hash_idx on public.ticket_extractions (pnr_hash)
  where pnr_hash is not null;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  post_type text not null default 'discussion'
    check (post_type in ('discussion', 'question', 'help', 'travel_tip', 'update', 'game', 'meme')),
  title text,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_community_created_idx on public.posts (community_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null unique references public.journeys (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_room_created_idx on public.messages (room_id, created_at);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolution text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helpers
create or replace function public.is_verified_member(p_journey_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.journey_members jm
    where jm.journey_id = p_journey_id
      and jm.user_id = auth.uid()
      and jm.status = 'verified'
  );
$$;

create or replace function public.can_access_train_date(p_train_id uuid, p_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.journey_members jm
    join public.journeys j on j.id = jm.journey_id
    where jm.user_id = auth.uid()
      and jm.status = 'verified'
      and j.train_id = p_train_id
      and j.journey_date = p_date
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.anonymous_profiles enable row level security;
alter table public.trains enable row level security;
alter table public.stations enable row level security;
alter table public.train_routes enable row level security;
alter table public.train_route_stops enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_segments enable row level security;
alter table public.communities enable row level security;
alter table public.journey_members enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_extractions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- Catalog readable to authenticated
create policy trains_read on public.trains for select to authenticated using (true);
create policy stations_read on public.stations for select to authenticated using (true);
create policy routes_read on public.train_routes for select to authenticated using (true);
create policy stops_read on public.train_route_stops for select to authenticated using (true);

create policy profiles_own on public.profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy anon_profiles_read on public.anonymous_profiles
  for select to authenticated using (true);
create policy anon_profiles_own_write on public.anonymous_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy journey_members_own_select on public.journey_members
  for select to authenticated using (user_id = auth.uid());
create policy journey_members_own_insert on public.journey_members
  for insert to authenticated with check (user_id = auth.uid());

create policy journeys_member_select on public.journeys
  for select to authenticated using (public.is_verified_member(id));

create policy communities_member_select on public.communities
  for select to authenticated using (
    public.can_access_train_date(train_id, journey_date)
  );

create policy tickets_own on public.tickets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy extractions_own on public.ticket_extractions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy posts_select on public.posts
  for select to authenticated using (
    exists (
      select 1 from public.communities c
      where c.id = community_id and public.can_access_train_date(c.train_id, c.journey_date)
    ) and deleted_at is null
  );
create policy posts_insert on public.posts
  for insert to authenticated with check (
    author_id = auth.uid() and exists (
      select 1 from public.communities c
      where c.id = community_id and public.can_access_train_date(c.train_id, c.journey_date)
    )
  );

create policy comments_select on public.comments
  for select to authenticated using (
    exists (
      select 1 from public.posts p
      join public.communities c on c.id = p.community_id
      where p.id = post_id and public.can_access_train_date(c.train_id, c.journey_date)
    ) and deleted_at is null
  );
create policy comments_insert on public.comments
  for insert to authenticated with check (
    author_id = auth.uid() and exists (
      select 1 from public.posts p
      join public.communities c on c.id = p.community_id
      where p.id = post_id and public.can_access_train_date(c.train_id, c.journey_date)
    )
  );

create policy reactions_all on public.post_reactions
  for all to authenticated using (
    exists (
      select 1 from public.posts p
      join public.communities c on c.id = p.community_id
      where p.id = post_id and public.can_access_train_date(c.train_id, c.journey_date)
    )
  ) with check (
    user_id = auth.uid() and exists (
      select 1 from public.posts p
      join public.communities c on c.id = p.community_id
      where p.id = post_id and public.can_access_train_date(c.train_id, c.journey_date)
    )
  );

create policy chat_rooms_select on public.chat_rooms
  for select to authenticated using (public.is_verified_member(journey_id));

create policy messages_select on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = room_id and public.is_verified_member(r.journey_id)
    ) and deleted_at is null
  );
create policy messages_insert on public.messages
  for insert to authenticated with check (
    author_id = auth.uid() and exists (
      select 1 from public.chat_rooms r
      where r.id = room_id and public.is_verified_member(r.journey_id)
    )
  );

create policy blocks_own on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy reports_insert on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_own_select on public.reports
  for select to authenticated using (reporter_id = auth.uid());

-- audit_logs: no client policies (service role only)
