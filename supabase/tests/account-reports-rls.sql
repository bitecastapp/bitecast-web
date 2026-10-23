-- Checks for deleting your own account and for reports. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/account-reports-rls.sql
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

-- A rates, comments and reports B's take; B's take exists to be reported.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare rb uuid;
begin
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Idli' limit 1), 4, 'Meh.') returning id into rb;
  insert into ids values ('rb', rb);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare ra uuid; rb uuid := (select v from ids where k = 'rb');
begin
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 9, 'Peak.') returning id into ra;
  insert into ids values ('ra', ra);
  insert into public.comments (rating_id, body) values (rb, 'Strong disagree.');
  insert into public.votes (rating_id, kind) values (rb, 'cap');
  insert into public.follows (followee_id) values ('00000000-0000-0000-0000-00000000000b');

  insert into public.reports (target_type, target_id, reason, note) values ('rating', rb, 'fake', 'Not the right dish.');
  begin
    insert into public.reports (target_type, target_id, reason) values ('rating', rb, 'spam');
    raise exception 'FAIL: reported the same take twice';
  exception when unique_violation then null;
  end;
  begin
    insert into public.reports (target_type, target_id, reason) values ('profile', rb, 'spam');
    raise exception 'FAIL: unknown report target accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.reports (target_type, target_id, reason) values ('dish', rb, 'because');
    raise exception 'FAIL: unknown reason accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.reports (target_type, target_id, reason, reporter_id) values ('dish', rb, 'duplicate', '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: reported on someone else''s behalf';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B can't see A's report.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
begin
  if exists (select 1 from public.reports) then raise exception 'FAIL: B can see A''s report'; end if;
end $$;

-- A deletes their account: everything of theirs goes, B's things stay (minus A's comment and vote on them).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  perform public.delete_my_account();
end $$;

reset role;
do $$
declare rb uuid := (select v from ids where k = 'rb');
begin
  if exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000a') then raise exception 'FAIL: auth user still there'; end if;
  if exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a') then raise exception 'FAIL: profile still there'; end if;
  if exists (select 1 from public.ratings where id = (select v from ids where k = 'ra')) then raise exception 'FAIL: rating still there'; end if;
  if exists (select 1 from public.comments where rating_id = rb) then raise exception 'FAIL: comment still there'; end if;
  if (select comments_count from public.ratings where id = rb) <> 0 or (select cap_count from public.ratings where id = rb) <> 0 then
    raise exception 'FAIL: counts on B''s take not updated';
  end if;
  if exists (select 1 from public.follows where follower_id = '00000000-0000-0000-0000-00000000000a')
     or exists (select 1 from public.reports where reporter_id = '00000000-0000-0000-0000-00000000000a') then
    raise exception 'FAIL: follows or reports left behind';
  end if;
  if not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b') then raise exception 'FAIL: B was deleted too'; end if;
end $$;

-- Signed out: can't delete anything or report.
set local role anon;
do $$
begin
  begin
    perform public.delete_my_account();
    raise exception 'FAIL: anon called delete_my_account';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.reports (target_type, target_id, reason) values ('dish', gen_random_uuid(), 'duplicate');
    raise exception 'FAIL: anon reported';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL ACCOUNT AND REPORT CHECKS PASSED' as result;
rollback;
