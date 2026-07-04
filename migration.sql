-- =========================================================
-- POWER CLASH — FULL SCHEMA MIGRATION
-- Run this once in Supabase SQL Editor (or via CLI migration)
-- =========================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- =========================================================
-- TABLE: profiles
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  total_wins int default 0,
  total_losses int default 0,
  total_battles int default 0,
  win_rate numeric default 0,
  current_win_streak int default 0,
  longest_win_streak int default 0,
  favorite_power_source text,
  favorite_fighting_style text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by any authenticated user" on public.profiles;
create policy "Profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- =========================================================
-- TABLE: fighters
-- =========================================================
create table if not exists public.fighters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  fighter_name text not null,
  character_type text not null,
  fighting_style text not null,
  power_source text not null,
  main_power text not null,
  main_power_level int not null,
  secondary_power text not null,
  secondary_power_level int not null,
  special_skill text not null,
  weakness text not null,
  ultimate_move text not null,
  ultimate_level int not null,
  strength int not null,
  speed int not null,
  durability int not null,
  battle_iq int not null,
  stamina int not null,
  stat_total int not null,
  power_point_cap int not null,
  power_point_cost int not null,
  is_valid_build boolean default false,
  base_image_key text,
  overlay_keys text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint fighter_name_not_empty check (char_length(trim(fighter_name)) > 0),
  constraint weakness_not_empty check (char_length(trim(weakness)) > 0)
);

alter table public.fighters enable row level security;

drop policy if exists "Users can read own fighters" on public.fighters;
create policy "Users can read own fighters"
  on public.fighters for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own fighters" on public.fighters;
create policy "Users can insert own fighters"
  on public.fighters for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own fighters" on public.fighters;
create policy "Users can update own fighters"
  on public.fighters for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own fighters" on public.fighters;
create policy "Users can delete own fighters"
  on public.fighters for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Friends can VIEW (not edit/delete) each other's fighters once accepted.
-- This policy is additive to the "own fighters" select policy above.
drop policy if exists "Accepted friends can view each other's fighters" on public.fighters;
create policy "Accepted friends can view each other's fighters"
  on public.fighters for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.user_id = auth.uid() and f.friend_id = fighters.owner_id)
        or
        (f.friend_id = auth.uid() and f.user_id = fighters.owner_id)
      )
    )
  );

-- =========================================================
-- TABLE: teams
-- =========================================================
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  team_name text not null,
  battle_mode text not null check (battle_mode in ('1v1','2v2','3v3')),
  fighter_ids uuid[] default '{}',
  fighter_snapshots jsonb default '[]',
  team_power_sources text[] default '{}',
  team_fighting_styles text[] default '{}',
  detected_synergies text[] default '{}',
  total_team_power_cost numeric default 0,
  average_strength numeric default 0,
  average_speed numeric default 0,
  average_durability numeric default 0,
  average_battle_iq numeric default 0,
  average_stamina numeric default 0,
  wins int default 0,
  losses int default 0,
  win_rate numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.teams enable row level security;

drop policy if exists "Users can read own teams" on public.teams;
create policy "Users can read own teams"
  on public.teams for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own teams" on public.teams;
create policy "Users can insert own teams"
  on public.teams for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own teams" on public.teams;
create policy "Users can update own teams"
  on public.teams for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own teams" on public.teams;
create policy "Users can delete own teams"
  on public.teams for delete
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Accepted friends can view each other's teams" on public.teams;
create policy "Accepted friends can view each other's teams"
  on public.teams for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
      and (
        (f.user_id = auth.uid() and f.friend_id = teams.owner_id)
        or
        (f.friend_id = auth.uid() and f.user_id = teams.owner_id)
      )
    )
  );

-- =========================================================
-- TABLE: battle_history
-- =========================================================
create table if not exists public.battle_history (
  id uuid primary key default gen_random_uuid(),
  player_a_id uuid references auth.users(id),
  player_b_id uuid references auth.users(id),
  participant_ids uuid[] default '{}',
  player_a_team_id uuid references public.teams(id),
  player_b_team_id uuid references public.teams(id),
  player_a_team_snapshot jsonb,
  player_b_team_snapshot jsonb,
  battle_mode text,
  battle_type text check (battle_type in ('PVP_CODE','PVP_LOCAL','VS_COMPUTER','PVP_FRIEND')),
  arena_name text,
  battle_twist text,
  player_a_score numeric,
  player_b_score numeric,
  winner_id uuid,
  winner_name text,
  loser_id uuid,
  loser_name text,
  mvp_fighter_name text,
  mvp_reason text,
  active_synergies_a text[] default '{}',
  active_synergies_b text[] default '{}',
  fight_summary text,
  turning_point text,
  why_loser_lost text[] default '{}',
  improvement_tips text[] default '{}',
  animation_rounds jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.battle_history enable row level security;

drop policy if exists "Users can read battles they participated in" on public.battle_history;
create policy "Users can read battles they participated in"
  on public.battle_history for select
  to authenticated
  using (auth.uid() = any(participant_ids));

drop policy if exists "Authenticated users can create battle history (temporary)" on public.battle_history;
create policy "Authenticated users can create battle history (temporary)"
  on public.battle_history for insert
  to authenticated
  with check (auth.uid() = any(participant_ids));

-- =========================================================
-- TABLE: story_progress
-- =========================================================
create table if not exists public.story_progress (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  selected_fighter_id uuid references public.fighters(id),
  selected_team_id uuid references public.teams(id),
  current_chapter int default 1,
  current_stage int default 1,
  choices_made jsonb default '[]',
  wins int default 0,
  losses int default 0,
  unlocked_rewards jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.story_progress enable row level security;

drop policy if exists "Users can read own story progress" on public.story_progress;
create policy "Users can read own story progress"
  on public.story_progress for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own story progress" on public.story_progress;
create policy "Users can insert own story progress"
  on public.story_progress for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own story progress" on public.story_progress;
create policy "Users can update own story progress"
  on public.story_progress for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- =========================================================
-- TABLE: friendships
-- =========================================================
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint no_self_friend check (user_id <> friend_id),
  constraint unique_friend_pair unique (user_id, friend_id)
);

alter table public.friendships enable row level security;

drop policy if exists "Users can read friendships involving them" on public.friendships;
create policy "Users can read friendships involving them"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Users can send friend requests" on public.friendships;
create policy "Users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Recipient can respond to a request; either side can update" on public.friendships;
create policy "Recipient can respond to a request; either side can update"
  on public.friendships for update
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Either side can delete a friendship" on public.friendships;
create policy "Either side can delete a friendship"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- =========================================================
-- DONE
-- =========================================================
