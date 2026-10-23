-- The overall score each dish keeps (count + average), and the vegan diet. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/dish-scores.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-00000000000a', 'rls_a', 'karnataka'),
  ('00000000-0000-0000-0000-00000000000b', 'rls_b', 'karnataka');

create temp table ids (k text primary key, v uuid) on commit drop;
grant all on ids to authenticated, anon;

set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare d uuid; r uuid;
begin
  insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'ctr'), 'Vegan Test Thali', 'vegan') returning id into d;
  insert into ids values ('dish', d);
  if (select rating_count from public.dishes where id = d) <> 0 or (select avg_score from public.dishes where id = d) is not null then
    raise exception 'FAIL: new dish should start unrated';
  end if;
  insert into public.ratings (dish_id, score) values (d, 8) returning id into r;
  insert into ids values ('ra', r);
  if (select avg_score from public.dishes where id = d) <> 8.0 then raise exception 'FAIL: first rating'; end if;
  begin
    update public.dishes set rating_count = 99 where id = d;
    raise exception 'FAIL: rating_count writable';
  exception when insufficient_privilege then null;
  end;
  insert into public.profile_private (show_diet) values ('vegan');
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare d uuid := (select v from ids where k = 'dish'); r uuid;
begin
  insert into public.ratings (dish_id, score) values (d, 9) returning id into r;
  insert into ids values ('rb', r);
  if (select rating_count from public.dishes where id = d) <> 2 or (select avg_score from public.dishes where id = d) <> 8.5 then
    raise exception 'FAIL: two ratings: %', (select row(rating_count, avg_score) from public.dishes where id = d);
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare d uuid := (select v from ids where k = 'dish');
begin
  update public.ratings set score = 6 where id = (select v from ids where k = 'ra');
  if (select avg_score from public.dishes where id = d) <> 7.5 then raise exception 'FAIL: score change'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare d uuid := (select v from ids where k = 'dish');
begin
  delete from public.ratings where id = (select v from ids where k = 'rb');
  if (select rating_count from public.dishes where id = d) <> 1 or (select avg_score from public.dishes where id = d) <> 6.0 then
    raise exception 'FAIL: after delete';
  end if;
end $$;

select 'ALL DISH SCORE CHECKS PASSED' as result;
rollback;
