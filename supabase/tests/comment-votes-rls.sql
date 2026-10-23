-- RLS and counter checks for likes/dislikes on comments. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/comment-votes-rls.sql
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

-- A posts a take and a comment, and can't like their own comment.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
declare rid uuid; cid uuid;
begin
  insert into public.ratings (dish_id, score, take) values ((select id from public.dishes where name = 'Masala Dosa' limit 1), 8, 'Solid.') returning id into rid;
  insert into public.comments (rating_id, body) values (rid, 'First!') returning id into cid;
  insert into ids values ('cid', cid);
  begin
    insert into public.comment_votes (comment_id, kind) values (cid, 'like');
    raise exception 'FAIL: liked own comment';
  exception when insufficient_privilege then null;
  end;
end $$;

-- B likes, switches to dislike, can't spoof user_id or touch the counters.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare cid uuid := (select v from ids where k = 'cid');
begin
  insert into public.comment_votes (comment_id, kind) values (cid, 'like');
  if (select like_count from public.comments where id = cid) <> 1 then raise exception 'FAIL: like not counted'; end if;

  update public.comment_votes set kind = 'dislike' where comment_id = cid;
  if (select like_count from public.comments where id = cid) <> 0 or (select dislike_count from public.comments where id = cid) <> 1 then
    raise exception 'FAIL: switch not counted';
  end if;

  begin
    insert into public.comment_votes (comment_id, kind) values (cid, 'like');
    raise exception 'FAIL: second vote accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.comment_votes (comment_id, kind) values (cid, 'meh');
    raise exception 'FAIL: bad kind accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.comment_votes (comment_id, kind, user_id) values (cid, 'like', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: wrote user_id';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.comments set like_count = 99 where id = cid;
    raise exception 'FAIL: like_count writable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A can't see B's vote; then B removes it and the count drops.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  if exists (select 1 from public.comment_votes) then raise exception 'FAIL: A can see B''s vote'; end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare cid uuid := (select v from ids where k = 'cid');
begin
  delete from public.comment_votes where comment_id = cid;
  if (select dislike_count from public.comments where id = cid) <> 0 then raise exception 'FAIL: unvote not counted'; end if;
end $$;

-- Signed-out visitors see counts, never votes, never vote.
reset role;
set local role anon;
do $$
begin
  if (select like_count from public.comments where id = (select v from ids where k = 'cid')) is null then raise exception 'FAIL: anon cannot read counts'; end if;
  begin
    perform 1 from public.comment_votes;
    raise exception 'FAIL: anon read votes';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL COMMENT VOTE CHECKS PASSED' as result;
rollback;
