-- Rankings (weighted, new accounts count half), Tastes like home (3+ ratings from the home region), fixed food lists
-- (auto-assigned, not user-editable) and the 30-day home region rule. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/rankings.sql
begin;

-- a, b, c: Hyderabadis; d: Kannadiga; all a month old. e: a brand-new account.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rk-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rk-b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'rk-c@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'rk-d@test.local'),
  ('00000000-0000-0000-0000-00000000000e', 'rk-e@test.local');
insert into public.profiles (id, username, home_region, created_at) values
  ('00000000-0000-0000-0000-00000000000a', 'rk_a', 'hyderabad', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000000b', 'rk_b', 'hyderabad', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000000c', 'rk_c', 'hyderabad', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000000d', 'rk_d', 'karnataka', now() - interval '30 days'),
  ('00000000-0000-0000-0000-00000000000e', 'rk_e', 'karnataka', now());

create temp table ids (k text primary key, v uuid) on commit drop;
grant all on ids to authenticated, anon;

-- Lists are fixed and every seeded dish sits in one; new dishes join by name.
do $$
declare
  vb uuid := (select id from public.restaurants where slug = 'vidyarthi-bhavan');
  d uuid;
begin
  if (select count(*) from public.spaces where created_by is null) <> 12 then raise exception 'FAIL: expected 12 seeded lists'; end if;
  if exists (select 1 from public.dishes where created_by is null and space_id is null) then
    raise exception 'FAIL: a seeded dish is in no list';
  end if;
  if (select origin_region from public.spaces where name = 'Biryani') <> 'hyderabad' then raise exception 'FAIL: biryani origin'; end if;

  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Paneer Tikka', 'veg') returning id into d;
  if (select space_id from public.dishes where id = d) is not null then raise exception 'FAIL: unmatched dish was listed'; end if;

  -- Four biryanis: X (four 9s), Y (one 10), W (one 10 from an old account), Z (one 10 from a new account), U (unrated).
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Biryani X', 'non_veg') returning id into d;
  if (select space_id from public.dishes where id = d) <> (select id from public.spaces where name = 'Biryani') then
    raise exception 'FAIL: new biryani not auto-listed';
  end if;
  insert into ids values ('x', d);
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Biryani Y', 'non_veg') returning id into d;
  insert into ids values ('y', d);
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Biryani W', 'non_veg') returning id into d;
  insert into ids values ('w', d);
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Biryani Z', 'non_veg') returning id into d;
  insert into ids values ('z', d);
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Biryani U', 'non_veg') returning id into d;
  insert into ids values ('u', d);
  -- Longest list name wins: this name contains both "bisi bele bath" and "dosa".
  insert into public.dishes (restaurant_id, name, diet) values (vb, 'Rk Bisi Bele Bath Dosa', 'veg') returning id into d;
  if (select s.name from public.dishes x join public.spaces s on s.id = x.space_id where x.id = d) <> 'Bisi Bele Bath' then
    raise exception 'FAIL: longest list name should win';
  end if;
end $$;

insert into public.ratings (user_id, dish_id, score)
select u, (select v from ids where k = 'x'), 9
from unnest(array[
  '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
  '00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000d'
]::uuid[]) as u;
insert into public.ratings (user_id, dish_id, score) values
  ('00000000-0000-0000-0000-00000000000a', (select v from ids where k = 'y'), 10),
  ('00000000-0000-0000-0000-00000000000b', (select v from ids where k = 'w'), 10),
  ('00000000-0000-0000-0000-00000000000e', (select v from ids where k = 'z'), 10);

-- Read the way the app does: signed out.
set local role anon;
do $$
declare x record; y record; w record; z record; u record;
begin
  select * into x from public.dish_rankings where dish_id = (select v from ids where k = 'x');
  select * into y from public.dish_rankings where dish_id = (select v from ids where k = 'y');
  select * into w from public.dish_rankings where dish_id = (select v from ids where k = 'w');
  select * into z from public.dish_rankings where dish_id = (select v from ids where k = 'z');
  select * into u from public.dish_rankings where dish_id = (select v from ids where k = 'u');

  if x.rank >= y.rank then raise exception 'FAIL: one 10/10 (rank %) beat four 9s (rank %)', y.rank, x.rank; end if;
  if w.rank_score <= z.rank_score then raise exception 'FAIL: a new account''s 10 should count less (% vs %)', z.rank_score, w.rank_score; end if;
  if u.rank is not null or u.rank_score is not null or u.ratings <> 0 then raise exception 'FAIL: unrated dish ranked'; end if;

  if x.home_avg <> 9.0 or x.home_count <> 3 then raise exception 'FAIL: tastes like home % from %', x.home_avg, x.home_count; end if;
  if y.home_avg is not null or y.home_count <> 1 then raise exception 'FAIL: tastes like home shown under 3 ratings'; end if;
  perform 1 from public.spaces;
end $$;

-- People can't make lists or move dishes; the home region changes at most once in 30 days.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  begin
    insert into public.spaces (name) values ('Pongal');
    raise exception 'FAIL: user created a list';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dishes set space_id = null where id = (select v from ids where k = 'x');
    raise exception 'FAIL: user moved a dish';
  exception when insufficient_privilege then null;
  end;

  update public.profiles set home_region = 'kerala' where id = '00000000-0000-0000-0000-00000000000a';
  if (select home_region_changed_at from public.profiles where id = '00000000-0000-0000-0000-00000000000a') is null then
    raise exception 'FAIL: change time not stamped';
  end if;
  begin
    update public.profiles set home_region = 'punjab' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: second change within 30 days allowed';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set home_region_changed_at = null where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: change time is client-writable';
  exception when insufficient_privilege then null;
  end;
  -- Saving the same region again is fine.
  update public.profiles set home_region = 'kerala' where id = '00000000-0000-0000-0000-00000000000a';
end $$;

select 'ALL RANKINGS CHECKS PASSED' as result;
rollback;
