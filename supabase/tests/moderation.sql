-- Moderation: admin-only actions, the dish approval queue, reports, bans and rate limits. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/moderation.sql
begin;

-- m: an admin. a, b: regular people.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'md-m@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'md-a@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'md-b@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-0000000000a1', 'md_m', 'karnataka'),
  ('00000000-0000-0000-0000-0000000000a2', 'md_a', 'karnataka'),
  ('00000000-0000-0000-0000-0000000000a3', 'md_b', 'karnataka');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');

create temp table ids (k text primary key, v uuid) on commit drop;
grant all on ids to authenticated, anon;

create function pg_temp.act_as(who text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000' || who, 'role', 'authenticated')::text, true);
end $$;
grant execute on function pg_temp.act_as(text) to authenticated;

set local role authenticated;

-- a adds a dish: it waits for approval, visible to a only; a rates it and b reports a's take.
select pg_temp.act_as('a2');
do $$
declare d uuid; r uuid;
begin
  insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'ctr'), 'Md Test Dosa', 'veg') returning id into d;
  insert into ids values ('dish', d);
  if (select approved_at from public.dishes where id = d) is not null then raise exception 'FAIL: user dish auto-approved'; end if;
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 3, 'Md test take') returning id into r;
  insert into ids values ('take', r);
  -- People can't touch the admin tools or their own ban.
  begin
    perform public.admin_approve_dish(d);
    raise exception 'FAIL: non-admin approved a dish';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set banned_at = null where id = '00000000-0000-0000-0000-0000000000a2';
    raise exception 'FAIL: ban columns are client-writable';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.act_as('a3');
do $$
begin
  if exists (select 1 from public.dishes where id = (select v from ids where k = 'dish')) then raise exception 'FAIL: pending dish visible to others'; end if;
  insert into public.reports (target_type, target_id, reason) values ('rating', (select v from ids where k = 'take'), 'fake');
  begin
    insert into public.reports (target_type, target_id, reason) values ('rating', (select v from ids where k = 'take'), 'duplicate');
    raise exception 'FAIL: a dish-only reason was accepted for a take';
  exception when check_violation then null;
  end;
end $$;

-- The admin sees the queue and every report, approves, removes the take, and bans a.
select pg_temp.act_as('a1');
do $$
declare d uuid := (select v from ids where k = 'dish'); own uuid;
begin
  if not exists (select 1 from public.dishes where id = d) then raise exception 'FAIL: admin cannot see the queue'; end if;
  if not exists (select 1 from public.reports where target_id = (select v from ids where k = 'take')) then raise exception 'FAIL: admin cannot see reports'; end if;
  perform public.admin_approve_dish(d);
  if (select approved_at from public.dishes where id = d) is null then raise exception 'FAIL: approve'; end if;

  perform public.admin_delete('rating', (select v from ids where k = 'take'), 'fake take');
  if exists (select 1 from public.ratings where id = (select v from ids where k = 'take')) then raise exception 'FAIL: take not deleted'; end if;
  if exists (select 1 from public.reports where target_id = (select v from ids where k = 'take') and resolved_at is null) then
    raise exception 'FAIL: report left open';
  end if;

  perform public.admin_set_ban('00000000-0000-0000-0000-0000000000a2', true, 'Fake takes');
  begin
    perform public.admin_set_ban('00000000-0000-0000-0000-0000000000a1', true, 'self');
    raise exception 'FAIL: admin banned themselves';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.moderation_log where admin_id = '00000000-0000-0000-0000-0000000000a1') <> 3 then
    raise exception 'FAIL: actions not logged';
  end if;

  -- An admin's own dish skips the queue.
  insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'ctr'), 'Md Admin Dosa', 'veg') returning id into own;
  if (select approved_at from public.dishes where id = own) is null then raise exception 'FAIL: admin dish not approved'; end if;
end $$;

-- b now sees the approved dish; a is suspended.
select pg_temp.act_as('a3');
do $$
begin
  if not exists (select 1 from public.dishes where id = (select v from ids where k = 'dish')) then raise exception 'FAIL: approved dish hidden'; end if;
  if exists (select 1 from public.reports where reporter_id <> '00000000-0000-0000-0000-0000000000a3') then raise exception 'FAIL: user sees others'' reports'; end if;
end $$;

select pg_temp.act_as('a2');
do $$
begin
  begin
    insert into public.ratings (dish_id, score) values ((select v from ids where k = 'dish'), 8);
    raise exception 'FAIL: banned account rated';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.follows (followee_id) values ('00000000-0000-0000-0000-0000000000a3');
    raise exception 'FAIL: banned account followed';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Rate limit: b can add 15 dishes a day, not 16.
select pg_temp.act_as('a3');
do $$
begin
  for i in 1..15 loop
    insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'mtr'), 'Md Limit ' || i, 'veg');
  end loop;
  begin
    insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'mtr'), 'Md Limit 16', 'veg');
    raise exception 'FAIL: 16th dish allowed';
  exception when program_limit_exceeded then null;
  end;
end $$;

-- Unbanning lets a post again.
select pg_temp.act_as('a1');
select public.admin_set_ban('00000000-0000-0000-0000-0000000000a2', false);
select pg_temp.act_as('a2');
do $$
begin
  insert into public.ratings (dish_id, score) values ((select v from ids where k = 'dish'), 8);
end $$;

select 'ALL MODERATION CHECKS PASSED' as result;
rollback;
