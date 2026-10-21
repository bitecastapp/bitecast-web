-- Restaurants (seed-only for now) and their dishes (seeded + user-added).

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 80),
  area text not null check (char_length(area) between 1 and 60),
  city text not null default 'Bengaluru' check (char_length(city) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 2 and 60),
  -- Duplicate key: lowercase, every run of non-letters/digits becomes one space. Mirrored by dishKey() in the app.
  name_key text generated always as (
    btrim(regexp_replace(lower(name), '[^[:alnum:]]+', ' ', 'g'))
  ) stored check (name_key <> ''),
  created_by uuid default auth.uid() references auth.users on delete set null, -- null = seeded
  created_at timestamptz not null default now(),
  unique (restaurant_id, name_key)
);

create index dishes_created_by_idx on public.dishes (created_by);

alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;

revoke all on public.restaurants, public.dishes from anon, authenticated;
grant select on public.restaurants to authenticated;
grant select on public.dishes to authenticated;
-- created_by comes from its default (the caller), never from the client.
grant insert (restaurant_id, name) on public.dishes to authenticated;

create policy "restaurants are readable by signed-in users"
  on public.restaurants for select
  to authenticated
  using (true);

create policy "dishes are readable by signed-in users"
  on public.dishes for select
  to authenticated
  using (true);

create policy "users add dishes as themselves"
  on public.dishes for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

-- Seed: the launch top 10 and the dishes each is known for.
insert into public.restaurants (slug, name, area) values
  ('vidyarthi-bhavan', 'Vidyarthi Bhavan', 'Basavanagudi'),
  ('mtr', 'Mavalli Tiffin Room (MTR)', 'Lalbagh Road'),
  ('ctr', 'CTR (Central Tiffin Room)', 'Malleshwaram'),
  ('brahmins-coffee-bar', 'Brahmin''s Coffee Bar', 'Basavanagudi'),
  ('the-rameshwaram-cafe', 'The Rameshwaram Cafe', 'Indiranagar'),
  ('meghana-foods', 'Meghana Foods', 'Koramangala'),
  ('nagarjuna', 'Nagarjuna', 'Residency Road'),
  ('shivaji-military-hotel', 'Shivaji Military Hotel', 'Jayanagar'),
  ('empire-restaurant', 'Empire Restaurant', 'Church Street'),
  ('truffles', 'Truffles', 'Koramangala');

insert into public.dishes (restaurant_id, name, created_by)
select r.id, d.name, null
from (values
  ('vidyarthi-bhavan', 'Masala Dosa'),
  ('vidyarthi-bhavan', 'Rava Vada'),
  ('vidyarthi-bhavan', 'Kesari Bath'),
  ('mtr', 'Rava Idli'),
  ('mtr', 'Bisi Bele Bath'),
  ('mtr', 'Masala Dosa'),
  ('ctr', 'Benne Masala Dosa'),
  ('ctr', 'Mangalore Bajji'),
  ('brahmins-coffee-bar', 'Idli'),
  ('brahmins-coffee-bar', 'Vada'),
  ('brahmins-coffee-bar', 'Kesari Bath'),
  ('brahmins-coffee-bar', 'Filter Coffee'),
  ('the-rameshwaram-cafe', 'Ghee Podi Idli'),
  ('the-rameshwaram-cafe', 'Ghee Masala Dosa'),
  ('meghana-foods', 'Chicken Biryani'),
  ('meghana-foods', 'Boneless Chicken Biryani'),
  ('nagarjuna', 'Andhra Meals'),
  ('nagarjuna', 'Chicken Biryani'),
  ('shivaji-military-hotel', 'Mutton Donne Biryani'),
  ('empire-restaurant', 'Ghee Rice'),
  ('empire-restaurant', 'Chicken Kebab'),
  ('truffles', 'All American Cheeseburger')
) as d (slug, name)
join public.restaurants r on r.slug = d.slug;
