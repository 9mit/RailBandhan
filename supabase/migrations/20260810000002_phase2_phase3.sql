-- RailBandhan Phase 2 + Phase 3 schema

-- Extend posts for poll type
alter table public.posts
  drop constraint if exists posts_post_type_check;

alter table public.posts
  add constraint posts_post_type_check
  check (post_type in (
    'discussion', 'question', 'help', 'travel_tip', 'update', 'game', 'meme', 'poll'
  ));

-- Auth user roles (service-managed; client reads via profiles metadata if needed)
alter table auth.users
  add column if not exists role text not null default 'user'
  check (role in ('user', 'moderator', 'admin'));

-- Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index direct_messages_conversation_created_idx
  on public.direct_messages (conversation_id, created_at);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in (
    'reply', 'mention', 'dm', 'game_invite', 'game_started',
    'journey_update', 'moderation', 'reaction'
  )),
  title text not null,
  body text not null,
  resource_type text,
  resource_id uuid,
  journey_id uuid references public.journeys (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

-- Game sessions
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  kind text not null check (kind in ('tic_tac_toe', 'connect_four')),
  status text not null default 'open'
    check (status in ('open', 'active', 'finished', 'cancelled')),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  player_ids uuid[] not null default '{}',
  max_players int not null default 2,
  state jsonb not null default '{}'::jsonb,
  winner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index game_sessions_journey_idx on public.game_sessions (journey_id, created_at desc);

-- Polls
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create index polls_journey_idx on public.polls (journey_id);

-- User badges
create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_code text not null check (badge_code in (
    'first_journey', 'frequent_traveller', 'helpful', 'ludo_champ', 'chatty', 'reporter'
  )),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.game_sessions enable row level security;
alter table public.polls enable row level security;
alter table public.user_badges enable row level security;

-- Conversations: members only
create policy conversations_member_select on public.conversations
  for select to authenticated using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id and cm.user_id = auth.uid()
    )
  );

create policy conversation_members_own on public.conversation_members
  for select to authenticated using (user_id = auth.uid());

create policy direct_messages_member_select on public.direct_messages
  for select to authenticated using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

create policy direct_messages_member_insert on public.direct_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
    )
  );

-- Notifications: owner only
create policy notifications_own on public.notifications
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Games: verified journey members
create policy game_sessions_member_select on public.game_sessions
  for select to authenticated using (public.is_verified_member(journey_id));

create policy game_sessions_member_insert on public.game_sessions
  for insert to authenticated with check (
    host_user_id = auth.uid() and public.is_verified_member(journey_id)
  );

create policy game_sessions_member_update on public.game_sessions
  for update to authenticated using (public.is_verified_member(journey_id));

-- Polls: verified journey members via post/community
create policy polls_member_select on public.polls
  for select to authenticated using (public.is_verified_member(journey_id));

create policy polls_member_insert on public.polls
  for insert to authenticated with check (public.is_verified_member(journey_id));

-- Badges: readable by authenticated; writes via service role
create policy user_badges_read on public.user_badges
  for select to authenticated using (true);

-- Reports: moderators can list all (service role in production)
create policy reports_moderator_select on public.reports
  for select to authenticated using (
    reporter_id = auth.uid()
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );

create policy reports_moderator_update on public.reports
  for update to authenticated using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid() and u.role in ('moderator', 'admin')
    )
  );
