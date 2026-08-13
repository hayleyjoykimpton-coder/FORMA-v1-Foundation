-- Run in Supabase SQL editor on an EXISTING Life & Soul project
-- (skip if you ran the full supabase/schema.sql on a fresh project)

alter table public.profiles add column if not exists is_admin boolean not null default false;

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

-- Make yourself admin (replace with your auth user id or run after finding your row):
-- update public.profiles set is_admin = true where email = 'hayleyjoykimpton@gmail.com';
