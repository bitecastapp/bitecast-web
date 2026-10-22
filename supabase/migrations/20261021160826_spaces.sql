-- Spaces: one leaderboard per food. A dish competes in at most one Space, assigned once.

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and char_length(name) between 2 and 40),
  -- Same rule as dishes.name_key; mirrored by dishKey()/dishSlug() in the app and used for /s/<slug> URLs.
  name_key text generated always as (
    btrim(regexp_replace(lower(name), '[[:space:]!-/:-@[-`{-~’‘“”–—…·]+', ' ', 'g'))
  ) stored unique check (name_key <> ''),
  created_by uuid default auth.uid() references auth.users on delete set null, -- null = seeded
  created_at timestamptz not null default now()
);

create index spaces_created_by_idx on public.spaces (created_by);

alter table public.dishes add column space_id uuid references public.spaces on delete set null;
create index dishes_space_id_idx on public.dishes (space_id);

alter table public.spaces enable row level security;

revoke all on public.spaces from anon, authenticated;
grant select on public.spaces to authenticated;
grant insert (name) on public.spaces to authenticated;
-- The only dish column users may ever change, and only from empty (see policy below).
grant update (space_id) on public.dishes to authenticated;

create policy "spaces are readable by signed-in users"
  on public.spaces for select
  to authenticated
  using (true);

create policy "users create spaces as themselves"
  on public.spaces for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

create policy "unassigned dishes can be put in a space once"
  on public.dishes for update
  to authenticated
  using (space_id is null)
  with check (space_id is not null);

-- Seed: 12 Spaces covering every seeded dish.
insert into public.spaces (name, created_by) values
  ('Dosa', null), ('Idli', null), ('Vada', null), ('Biryani', null),
  ('Kesari Bath', null), ('Bisi Bele Bath', null), ('Filter Coffee', null), ('Meals', null),
  ('Burger', null), ('Kebab', null), ('Bajji', null), ('Ghee Rice', null);

update public.dishes d
set space_id = s.id
from (values
  ('Masala Dosa', 'Dosa'), ('Benne Masala Dosa', 'Dosa'), ('Ghee Masala Dosa', 'Dosa'),
  ('Idli', 'Idli'), ('Rava Idli', 'Idli'), ('Ghee Podi Idli', 'Idli'),
  ('Vada', 'Vada'), ('Rava Vada', 'Vada'),
  ('Chicken Biryani', 'Biryani'), ('Boneless Chicken Biryani', 'Biryani'), ('Mutton Donne Biryani', 'Biryani'),
  ('Kesari Bath', 'Kesari Bath'),
  ('Bisi Bele Bath', 'Bisi Bele Bath'),
  ('Filter Coffee', 'Filter Coffee'),
  ('Andhra Meals', 'Meals'),
  ('All American Cheeseburger', 'Burger'),
  ('Chicken Kebab', 'Kebab'),
  ('Mangalore Bajji', 'Bajji'),
  ('Ghee Rice', 'Ghee Rice')
) as m (dish, space)
join public.spaces s on s.name = m.space
where d.name = m.dish and d.created_by is null;
