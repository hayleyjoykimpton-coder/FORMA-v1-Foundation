-- Life & Soul notice board — run once in Supabase → SQL Editor
-- Fixes: "Could not find the table public.community_posts in the schema cache"
--
-- After running:
--   1. update public.profiles set is_admin = true where email = 'your-coach@email.com';
--   2. Set NEXT_PUBLIC_ADMIN_EMAILS=your-coach@email.com in Vercel and redeploy

create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists club text not null default '';

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

alter table public.community_posts enable row level security;

-- Authenticated users can read/write via RLS policies below
grant select, insert, update, delete on public.community_posts to authenticated;
grant select on public.community_posts to anon;

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

-- Live updates on the Board tab (optional — skip if this errors on older projects)
do $$
begin
  alter publication supabase_realtime add table public.community_posts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Refresh PostgREST schema cache so the API sees the new table immediately
notify pgrst, 'reload schema';

-- Coach admin (replace email before running, or run separately):
-- update public.profiles set is_admin = true where lower(email) = lower('hayleyjoykimpton@gmail.com');
