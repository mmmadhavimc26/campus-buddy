-- Run once in the Supabase SQL Editor, then run seed.sql.
begin;
create table if not exists public.locations (
  id text primary key,
  name text not null,
  category text not null,
  x double precision not null check (x between 0 and 1000),
  y double precision not null check (y between 0 and 760),
  width double precision not null check (width > 0),
  height double precision not null check (height > 0),
  description text not null default '',
  facilities jsonb not null default '[]' check (jsonb_typeof(facilities) = 'array'),
  aliases jsonb not null default '[]' check (jsonb_typeof(aliases) = 'array')
);
alter table public.locations add column if not exists kind text not null default 'location';
alter table public.locations add column if not exists building_id text;
alter table public.locations add column if not exists reference_no text;
alter table public.locations add column if not exists floor text;
alter table public.locations add column if not exists layout_version text;
alter table public.locations add column if not exists opening_hours text not null default '';
alter table public.locations add column if not exists room text not null default '';
alter table public.locations add column if not exists updated_at timestamptz not null default now();
create or replace function public.set_location_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = clock_timestamp(); return new; end; $$;
drop trigger if exists location_updated_at on public.locations;
create trigger location_updated_at before update on public.locations for each row execute function public.set_location_updated_at();
create table if not exists public.paths (
  id bigint generated always as identity primary key,
  "from" text not null references public.locations(id) on delete cascade,
  "to" text not null references public.locations(id) on delete cascade,
  distance double precision not null check (distance > 0),
  distance_verified boolean not null default false,
  unique ("from", "to")
);
-- Safe upgrade when schema.sql was run for an earlier app version.
alter table public.paths add column if not exists distance_verified boolean not null default false;
alter table public.paths add column if not exists points jsonb;
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  location_id text references public.locations(id) on delete set null,
  message text not null check (char_length(trim(message)) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending','reviewed','resolved')),
  created_at timestamptz not null default now()
);
alter table public.locations enable row level security;
alter table public.paths enable row level security;
alter table public.feedback enable row level security;
revoke all on public.locations, public.paths, public.feedback from anon, authenticated;
grant select on public.locations, public.paths to anon, authenticated;
grant insert (location_id, message) on public.feedback to anon, authenticated;
drop policy if exists "Campus locations are readable" on public.locations;
create policy "Campus locations are readable" on public.locations for select to anon, authenticated using (true);
drop policy if exists "Campus paths are readable" on public.paths;
create policy "Campus paths are readable" on public.paths for select to anon, authenticated using (true);
drop policy if exists "Visitors can report an issue" on public.feedback;
create policy "Visitors can report an issue" on public.feedback for insert to anon, authenticated
  with check (status = 'pending' and char_length(trim(message)) between 10 and 2000);
-- Administrator membership is assigned only through the trusted SQL dashboard.
-- Visitors and normal authenticated users cannot create or change membership.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
drop policy if exists "Users can check their admin membership" on public.admin_users;
create policy "Users can check their admin membership" on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));
grant update (name, category, floor, description, facilities, aliases, opening_hours, room) on public.locations to authenticated;
drop policy if exists "Administrators can edit location details" on public.locations;
create policy "Administrators can edit location details" on public.locations for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
-- No normal visitor can read reports. Dashboard SQL retains full administration.
commit;
