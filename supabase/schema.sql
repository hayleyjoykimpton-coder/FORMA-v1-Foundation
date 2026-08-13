-- Life & Soul / FORMA multi-user schema (run in Supabase SQL editor)
-- Each signed-in user only sees their own rows (RLS).
-- Community tables: shared read for signed-in members; admin can pin/post notices.

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  email text not null default '',
  profile_photo text not null default '',
  age integer,
  height numeric,
  weight numeric,
  gender text not null default 'unspecified',
  goal text not null default 'sculpt',
  experience_level text not null default 'beginner',
  training_days integer not null default 3,
  equipment_access text not null default 'full_gym',
  workout_location text not null default 'gym',
  preferred_training_style text not null default 'strength',
  injuries text not null default '',
  limitations text not null default '',
  lifestyle text not null default '',
  sleep_average numeric,
  daily_steps integer,
  nutrition_goal text not null default 'maintain',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- App blob state (workouts, history, programme meta, progress, photos, session draft)
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workouts jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  programme jsonb not null default '{}'::jsonb,
  progress jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  water jsonb not null default '{}'::jsonb,
  journal jsonb not null default '{}'::jsonb,
  session_draft jsonb,
  updated_at timestamptz not null default now()
);

-- 6-week challenge: notice board + community messages
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  title text,
  body text not null,
  post_type text not null check (post_type in ('notice', 'community')),
  pinned boolean not null default false,
  pin_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_list_idx
  on public.community_posts (post_type, pinned desc, pin_order nulls last, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.community_posts enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "state_select_own" on public.user_state;
drop policy if exists "state_insert_own" on public.user_state;
drop policy if exists "state_update_own" on public.user_state;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "state_select_own" on public.user_state for select using (auth.uid() = user_id);
create policy "state_insert_own" on public.user_state for insert with check (auth.uid() = user_id);
create policy "state_update_own" on public.user_state for update using (auth.uid() = user_id);

-- Admin helper (coach account — set profiles.is_admin = true in Supabase)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

drop policy if exists "community_select" on public.community_posts;
drop policy if exists "community_insert_message" on public.community_posts;
drop policy if exists "community_insert_notice" on public.community_posts;
drop policy if exists "community_update_admin" on public.community_posts;
drop policy if exists "community_update_own_body" on public.community_posts;
drop policy if exists "community_delete_own" on public.community_posts;
drop policy if exists "community_delete_admin" on public.community_posts;

create policy "community_select" on public.community_posts
  for select using (auth.uid() is not null);

create policy "community_insert_message" on public.community_posts
  for insert with check (auth.uid() = author_id and post_type = 'community');

create policy "community_insert_notice" on public.community_posts
  for insert with check (auth.uid() = author_id and post_type = 'notice' and public.is_admin());

create policy "community_update_admin" on public.community_posts
  for update using (public.is_admin());

create policy "community_update_own_body" on public.community_posts
  for update using (auth.uid() = author_id and post_type = 'community' and not pinned)
  with check (auth.uid() = author_id and post_type = 'community' and pinned = false);

create policy "community_delete_own" on public.community_posts
  for delete using (auth.uid() = author_id and post_type = 'community');

create policy "community_delete_admin" on public.community_posts
  for delete using (public.is_admin());

-- Auto-create profile + empty state on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', '')
  )
  on conflict (id) do nothing;

  insert into public.user_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
