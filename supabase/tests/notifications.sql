-- Notifications: who gets told what, no duplicates from toggling, and only you can read yours. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/notifications.sql
begin;

-- a: posts a take and a dish. b: agrees, comments, follows. m: an admin.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'nt-a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'nt-b@test.local'),
  ('00000000-0000-0000-0000-0000000000b3', 'nt-m@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-0000000000b1', 'nt_a', 'karnataka'),
  ('00000000-0000-0000-0000-0000000000b2', 'nt_b', 'karnataka'),
  ('00000000-0000-0000-0000-0000000000b3', 'nt_m', 'karnataka');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000b3');

create temp table ids (k text primary key, v uuid) on commit drop;
grant all on ids to authenticated;

create function pg_temp.act_as(who text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000' || who, 'role', 'authenticated')::text, true);
end $$;
grant execute on function pg_temp.act_as(text) to authenticated;
-- How many notifications of `kind` `who` has (counted as the database owner, past RLS).
create function pg_temp.count(who text, kind text) returns int language sql security definer as $$
  select count(*)::int from public.notifications where user_id = ('00000000-0000-0000-0000-0000000000' || who)::uuid and notifications.kind = count.kind;
$$;
grant execute on function pg_temp.count(text, text) to authenticated;

set local role authenticated;

select pg_temp.act_as('b1');
do $$
declare r uuid; d uuid;
begin
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 8, 'Nt take') returning id into r;
  insert into ids values ('take', r);
  insert into public.dishes (restaurant_id, name, diet) values ((select id from public.restaurants where slug = 'ctr'), 'Nt Test Dosa', 'veg') returning id into d;
  insert into ids values ('dish', d);
end $$;

-- b agrees (then toggles away and back), comments, and follows twice over.
select pg_temp.act_as('b2');
do $$
declare c uuid;
begin
  insert into public.votes (rating_id, kind) values ((select v from ids where k = 'take'), 'facts');
  update public.votes set kind = 'cap' where rating_id = (select v from ids where k = 'take');
  update public.votes set kind = 'facts' where rating_id = (select v from ids where k = 'take');
  insert into public.comments (rating_id, body) values ((select v from ids where k = 'take'), 'Nt comment') returning id into c;
  insert into ids values ('comment', c);
  insert into public.follows (followee_id) values ('00000000-0000-0000-0000-0000000000b1');
  delete from public.follows where followee_id = '00000000-0000-0000-0000-0000000000b1';
  insert into public.follows (followee_id) values ('00000000-0000-0000-0000-0000000000b1');
  -- b can't read a's notifications or write any.
  if exists (select 1 from public.notifications where user_id = '00000000-0000-0000-0000-0000000000b1') then raise exception 'FAIL: read someone else''s'; end if;
  begin
    insert into public.notifications (user_id, kind) values ('00000000-0000-0000-0000-0000000000b1', 'follow');
    raise exception 'FAIL: wrote a notification';
  exception when insufficient_privilege then null;
  end;
end $$;

-- a replies to b's comment.
select pg_temp.act_as('b1');
do $$
begin
  insert into public.comments (rating_id, parent_id, body) values ((select v from ids where k = 'take'), (select v from ids where k = 'comment'), 'Nt reply');
  if pg_temp.count('b1', 'agree') <> 1 then raise exception 'FAIL: agree count %', pg_temp.count('b1', 'agree'); end if;
  if pg_temp.count('b1', 'comment') <> 1 then raise exception 'FAIL: comment'; end if;
  if pg_temp.count('b1', 'follow') <> 1 then raise exception 'FAIL: follow count %', pg_temp.count('b1', 'follow'); end if;
  if pg_temp.count('b2', 'reply') <> 1 then raise exception 'FAIL: reply'; end if;
  if pg_temp.count('b1', 'reply') <> 0 or pg_temp.count('b1', 'comment') <> 1 then raise exception 'FAIL: notified about own reply'; end if;
  -- a marks theirs read.
  update public.notifications set read_at = now() where user_id = '00000000-0000-0000-0000-0000000000b1';
  if exists (select 1 from public.notifications where read_at is null) then raise exception 'FAIL: mark read'; end if;
end $$;

-- The admin approves a's dish and removes b's comment.
select pg_temp.act_as('b3');
do $$
begin
  perform public.admin_approve_dish((select v from ids where k = 'dish'));
  perform public.admin_delete('comment', (select v from ids where k = 'comment'), 'test');
  if pg_temp.count('b1', 'dish_approved') <> 1 then raise exception 'FAIL: dish approved'; end if;
  if pg_temp.count('b2', 'comment_removed') <> 1 then raise exception 'FAIL: comment removed'; end if;
end $$;

select 'ALL NOTIFICATION CHECKS PASSED' as result;
rollback;
