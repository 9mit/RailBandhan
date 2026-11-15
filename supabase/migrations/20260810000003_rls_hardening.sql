-- Harden RLS after audit: expiry checks, no self-verify, game update least privilege

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
      and jm.expires_at > now()
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
      and jm.expires_at > now()
      and j.train_id = p_train_id
      and j.journey_date = p_date
  );
$$;

drop policy if exists journey_members_own_insert on public.journey_members;
create policy journey_members_own_insert on public.journey_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and verification_method in ('manual', 'ticket_extracted')
  );

drop policy if exists game_sessions_member_update on public.game_sessions;
create policy game_sessions_member_update on public.game_sessions
  for update to authenticated
  using (
    public.is_verified_member(journey_id)
    and (host_user_id = auth.uid() or auth.uid() = any (player_ids))
  );
