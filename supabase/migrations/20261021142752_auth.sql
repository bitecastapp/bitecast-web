-- Auth + onboarding: home regions and user profiles.

create table public.regions (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  demonym text not null -- used in copy: "8.7 from 12 Bengalureans"
);

insert into public.regions (slug, name, demonym) values
  ('bengaluru', 'Bengaluru', 'Bengalureans');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  home_region text not null references public.regions (slug),
  created_at timestamptz not null default now()
);

create index profiles_home_region_idx on public.profiles (home_region);

alter table public.regions enable row level security;
alter table public.profiles enable row level security;

-- New tables are not exposed to the Data API by default; grant exactly what the app needs.
revoke all on public.regions, public.profiles from anon, authenticated;
grant select on public.regions to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, username, home_region) on public.profiles to authenticated;
grant update (username, home_region) on public.profiles to authenticated;

create policy "regions are readable by everyone"
  on public.regions for select
  to anon, authenticated
  using (true);

create policy "profiles are readable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
