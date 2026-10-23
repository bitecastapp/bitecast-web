-- "Want to try" privacy: everyone / people who follow you / only you, enforced on the saves rows. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/privacy.sql
begin;

-- a owns the list; b follows a; c doesn't.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'pv-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'pv-b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'pv-c@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-00000000000a', 'pv_a', 'karnataka'),
  ('00000000-0000-0000-0000-00000000000b', 'pv_b', 'karnataka'),
  ('00000000-0000-0000-0000-00000000000c', 'pv_c', 'karnataka');
insert into public.follows (follower_id, followee_id) values
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
insert into public.saves (user_id, dish_id) values
  ('00000000-0000-0000-0000-00000000000a', (select id from public.dishes where name = 'Masala Dosa' limit 1));

-- Can `who` see a's saves? (who = null: signed out)
create function pg_temp.sees(who uuid) returns boolean language plpgsql as $$
declare n int;
begin
  if who is null then
    set local role anon;
  else
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
  end if;
  select count(*) into n from public.saves where user_id = '00000000-0000-0000-0000-00000000000a';
  reset role;
  return n > 0;
end $$;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
begin
  -- Default: everyone.
  if not (pg_temp.sees(null) and pg_temp.sees(b) and pg_temp.sees(c)) then raise exception 'FAIL: default should be public'; end if;

  update public.profiles set saves_visibility = 'followers' where id = a;
  if pg_temp.sees(null) or pg_temp.sees(c) then raise exception 'FAIL: followers-only list leaked'; end if;
  if not pg_temp.sees(b) then raise exception 'FAIL: a follower should see it'; end if;
  if not pg_temp.sees(a) then raise exception 'FAIL: the owner should see it'; end if;

  update public.profiles set saves_visibility = 'only_me' where id = a;
  if pg_temp.sees(b) or pg_temp.sees(c) or pg_temp.sees(null) then raise exception 'FAIL: private list leaked'; end if;
  if not pg_temp.sees(a) then raise exception 'FAIL: the owner should still see it'; end if;
end $$;

-- Only you set your own privacy, and only to known values.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  update public.profiles set diary_visibility = 'only_me' where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: changed someone else''s privacy'; end if;
  update public.profiles set diary_visibility = 'followers' where id = '00000000-0000-0000-0000-00000000000b';
  begin
    update public.profiles set diary_visibility = 'friends' where id = '00000000-0000-0000-0000-00000000000b';
    raise exception 'FAIL: unknown visibility accepted';
  exception when check_violation then null;
  end;
end $$;

select 'ALL PRIVACY CHECKS PASSED' as result;
rollback;
