-- RLS, favourites and stats checks for profiles. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/profiles-rls.sql
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

-- A edits their profile and rates two dishes; B rates one.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare r1 uuid; r2 uuid;
begin
  update public.profiles set display_name = 'Asha', bio = 'Dosa first, questions later.', avatar = '2a31' where id = '00000000-0000-0000-0000-00000000000a';
  begin
    update public.profiles set avatar = 'NOPE!' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: bad avatar code accepted';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set bio = repeat('x', 161) where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: 161-character bio accepted';
  exception when check_violation then null;
  end;

  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 9, 'Peak.') returning id into r1;
  insert into public.ratings (dish_id, score) values ((select id from public.dishes where name = 'Rava Idli' limit 1), 7) returning id into r2;
  insert into ids values ('a1', r1), ('a2', r2);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare rb uuid;
begin
  update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000a';
  if (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'Asha' then
    raise exception 'FAIL: B edited A''s profile';
  end if;
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Idli' limit 1), 8, 'Soft.') returning id into rb;
  insert into ids values ('b1', rb);
  -- B agrees with A's take: A's trust goes up by one.
  insert into public.votes (rating_id, kind) values ((select v from ids where k = 'a1'), 'facts');
end $$;

-- A pins favourites: own ratings only, at most 4, replaced all at once.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  perform public.set_favourites(array[(select v from ids where k = 'a2'), (select v from ids where k = 'a1')]);
  if (select array_agg(rating_id order by position) from public.favourites where user_id = '00000000-0000-0000-0000-00000000000a')
     <> array[(select v from ids where k = 'a2'), (select v from ids where k = 'a1')] then
    raise exception 'FAIL: favourites not saved in order';
  end if;

  begin
    perform public.set_favourites(array[(select v from ids where k = 'b1')]);
    raise exception 'FAIL: pinned someone else''s rating';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.favourites where user_id = '00000000-0000-0000-0000-00000000000a') <> 2 then
    raise exception 'FAIL: a failed save wiped the old favourites';
  end if;

  begin
    perform public.set_favourites(array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()]);
    raise exception 'FAIL: 5 favourites accepted';
  exception when check_violation then null;
  end;

  perform public.set_favourites(array[(select v from ids where k = 'a1')]);
  if (select count(*) from public.favourites where user_id = '00000000-0000-0000-0000-00000000000a') <> 1 then
    raise exception 'FAIL: replacing favourites';
  end if;

  if (select rated from public.profile_stats('00000000-0000-0000-0000-00000000000a')) <> 2
     or (select average from public.profile_stats('00000000-0000-0000-0000-00000000000a')) <> 8.0
     or (select trust from public.profile_stats('00000000-0000-0000-0000-00000000000a')) <> 1 then
    raise exception 'FAIL: stats %', (select row(rated, average, trust) from public.profile_stats('00000000-0000-0000-0000-00000000000a'));
  end if;

  -- Follows: A follows B, not themselves, never on someone else's behalf.
  insert into public.follows (followee_id) values ('00000000-0000-0000-0000-00000000000b');
  begin
    insert into public.follows (followee_id) values ('00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: followed self';
  exception when check_violation then null;
  end;
  begin
    insert into public.follows (follower_id, followee_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: followed on someone else''s behalf';
  exception when insufficient_privilege then null;
  end;
  if (select followers from public.profile_stats('00000000-0000-0000-0000-00000000000b')) <> 1
     or (select following from public.profile_stats('00000000-0000-0000-0000-00000000000a')) <> 1 then
    raise exception 'FAIL: follow counts';
  end if;

  -- Deleting a rating unpins it.
  delete from public.ratings where id = (select v from ids where k = 'a1');
  if exists (select 1 from public.favourites where user_id = '00000000-0000-0000-0000-00000000000a') then
    raise exception 'FAIL: deleted rating still pinned';
  end if;
end $$;

-- B can't remove A's follow.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  delete from public.follows where follower_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B removed A''s follow'; end if;
end $$;

-- Signed-out visitors see profiles, favourites and stats; they can't pin.
reset role;
set local role anon;
do $$
begin
  if (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'Asha' then raise exception 'FAIL: anon cannot read profile'; end if;
  perform public.profile_stats('00000000-0000-0000-0000-00000000000a');
  if not exists (select 1 from public.follows) then raise exception 'FAIL: anon cannot read follows'; end if;
  begin
    insert into public.follows (followee_id) values ('00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: anon followed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.set_favourites(array[]::uuid[]);
    raise exception 'FAIL: anon called set_favourites';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL PROFILE CHECKS PASSED' as result;
rollback;
