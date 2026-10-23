-- RLS, threading and counter checks for comments. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/comments-rls.sql
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
declare
  rid uuid;
  other uuid;
  top uuid;
  reply uuid;
  n int;
begin
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 8, 'Solid.') returning id into rid;
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Rava Idli' limit 1), 6, 'Fine.') returning id into other;
  insert into ids values ('rid', rid);

  insert into public.comments (rating_id, body) values (rid, 'First!') returning id into top;
  insert into public.comments (rating_id, parent_id, body) values (rid, top, 'Reply') returning id into reply;
  insert into ids values ('top', top), ('reply', reply);

  if (select comments_count from public.ratings where id = rid) <> 2 then raise exception 'FAIL: count after 2 comments'; end if;

  -- Replies go one level deep.
  begin
    insert into public.comments (rating_id, parent_id, body) values (rid, reply, 'Too deep');
    raise exception 'FAIL: reply to a reply accepted';
  exception when check_violation then null;
  end;
  -- A reply must be on the same take.
  begin
    insert into public.comments (rating_id, parent_id, body) values (other, top, 'Wrong take');
    raise exception 'FAIL: cross-take reply accepted';
  exception when check_violation then null;
  end;
  -- Empty or untrimmed bodies.
  begin
    insert into public.comments (rating_id, body) values (rid, ' ');
    raise exception 'FAIL: blank comment accepted';
  exception when check_violation then null;
  end;
  -- No editing, no writing someone else's user_id, no touching the counter.
  begin
    update public.comments set body = 'edited' where id = top;
    raise exception 'FAIL: edit allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.comments (rating_id, body, user_id) values (rid, 'spoof', '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: wrote user_id';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.ratings set comments_count = 99 where id = rid;
    raise exception 'FAIL: comments_count writable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B can't delete A's comment; B comments; then A deletes the thread and counts follow.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  delete from public.comments where id = (select v from ids where k = 'top');
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A''s comment'; end if;
  insert into public.comments (rating_id, parent_id, body) values ((select v from ids where k = 'rid'), (select v from ids where k = 'top'), 'B replies');
  if (select comments_count from public.ratings where id = (select v from ids where k = 'rid')) <> 3 then raise exception 'FAIL: count after B reply'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  -- Deleting a top-level comment removes its replies (cascade) and the count follows.
  delete from public.comments where id = (select v from ids where k = 'top');
  if (select comments_count from public.ratings where id = (select v from ids where k = 'rid')) <> 0 then
    raise exception 'FAIL: count after deleting thread = %', (select comments_count from public.ratings where id = (select v from ids where k = 'rid'));
  end if;
  insert into public.comments (rating_id, body) values ((select v from ids where k = 'rid'), 'Back again');
end $$;

-- Signed-out visitors read comments, never write.
reset role;
set local role anon;
do $$
begin
  if not exists (select 1 from public.comments) then raise exception 'FAIL: anon cannot read comments'; end if;
  begin
    insert into public.comments (rating_id, body) values ((select v from ids where k = 'rid'), 'anon');
    raise exception 'FAIL: anon commented';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL COMMENT CHECKS PASSED' as result;
rollback;
