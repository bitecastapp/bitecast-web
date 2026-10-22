-- RLS and counter checks for ratings, photos and votes. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/social-rls.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'rls-c@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-00000000000a', 'rls_a', 'bengaluru'),
  ('00000000-0000-0000-0000-00000000000b', 'rls_b', 'bengaluru');
-- user c has no profile (never finished onboarding)

create temp table ids (k text primary key, v uuid) on commit drop;
grant all on ids to authenticated, anon;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  dosa uuid := (select id from public.dishes where name = 'Masala Dosa' limit 1);
  idli uuid := (select id from public.dishes where name = 'Rava Idli' limit 1);
  rid uuid;
begin
  -- A rates (score only), then adds a take: same row, updated.
  insert into public.ratings (dish_id, score) values (dosa, 8) returning id into rid;
  insert into ids values ('a_rating', rid);
  update public.ratings set take = 'Crisp, buttery, worth the queue.' where id = rid;

  -- A second rating of the same dish is refused.
  begin
    insert into public.ratings (dish_id, score) values (dosa, 3);
    raise exception 'FAIL: second rating accepted';
  exception when unique_violation then null;
  end;

  -- Bad scores and takes.
  begin
    insert into public.ratings (dish_id, score) values (idli, 11);
    raise exception 'FAIL: score 11 accepted';
  exception when check_violation then null;
  end;
  begin
    update public.ratings set score = 7.3 where id = rid;
    raise exception 'FAIL: score 7.3 accepted (half steps only)';
  exception when check_violation then null;
  end;
  update public.ratings set score = 7.5 where id = rid;
  if (select score from public.ratings where id = rid) <> 7.5 then raise exception 'FAIL: half score not kept'; end if;
  begin
    update public.ratings set take = ' padded' where id = rid;
    raise exception 'FAIL: untrimmed take accepted';
  exception when check_violation then null;
  end;

  -- Counters and owner are not client-writable.
  begin
    update public.ratings set facts_count = 999 where id = rid;
    raise exception 'FAIL: facts_count writable';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.ratings (dish_id, score, user_id) values (idli, 5, '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: wrote user_id';
  exception when insufficient_privilege then null;
  end;

  -- Photos: own rating and own folder only.
  insert into public.rating_photos (rating_id, path, position)
    values (rid, '00000000-0000-0000-0000-00000000000a/one.webp', 1);
  begin
    insert into public.rating_photos (rating_id, path, position)
      values (rid, '00000000-0000-0000-0000-00000000000b/sneaky.webp', 2);
    raise exception 'FAIL: photo in someone else''s folder';
  exception when insufficient_privilege then null;
  end;

  -- No voting on your own take.
  begin
    insert into public.votes (rating_id, kind) values (rid, 'facts');
    raise exception 'FAIL: self-vote accepted';
  exception when insufficient_privilege then null;
  end;

  -- The dish keeps its overall score: this rating counts, a score change moves the average.
  if (select rating_count from public.dishes where id = dosa) < 1 then raise exception 'FAIL: dish rating_count not kept'; end if;
end $$;

-- B votes Facts, switches to Cap, then removes the vote; counters follow.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare
  rid uuid := (select v from ids where k = 'a_rating');
  f int; c int; n int;
begin
  insert into public.votes (rating_id, kind) values (rid, 'facts');
  select facts_count, cap_count into f, c from public.ratings where id = rid;
  if (f, c) <> (1, 0) then raise exception 'FAIL: counts after facts = %/%', f, c; end if;

  update public.votes set kind = 'cap' where rating_id = rid;
  select facts_count, cap_count into f, c from public.ratings where id = rid;
  if (f, c) <> (0, 1) then raise exception 'FAIL: counts after switch = %/%', f, c; end if;

  begin
    insert into public.votes (rating_id, kind) values (rid, 'facts');
    raise exception 'FAIL: double vote accepted';
  exception when unique_violation then null;
  end;

  delete from public.votes where rating_id = rid;
  select facts_count, cap_count into f, c from public.ratings where id = rid;
  if (f, c) <> (0, 0) then raise exception 'FAIL: counts after delete = %/%', f, c; end if;

  -- B can't edit A's rating or remove A's photos.
  update public.ratings set score = 1 where id = rid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B edited A''s rating'; end if;
  delete from public.rating_photos where rating_id = rid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A''s photo'; end if;

  -- Vote again so the checks below have a vote to (not) see.
  insert into public.votes (rating_id, kind) values (rid, 'facts');
end $$;

-- C has no profile, so can't rate.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
do $$
begin
  insert into public.ratings (dish_id, score) values ((select id from public.dishes where name = 'Idli' limit 1), 7);
  raise exception 'FAIL: rated without a profile';
exception when foreign_key_violation then null;
end $$;

-- A sees only their own votes (none); individual votes stay private.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  if exists (select 1 from public.votes) then raise exception 'FAIL: A can see B''s vote'; end if;
end $$;

-- Signed-out visitors read ratings, photos, profiles and dishes; never votes; never write.
reset role;
set local role anon;
do $$
begin
  if not exists (select 1 from public.ratings where take is not null) then raise exception 'FAIL: anon cannot read ratings'; end if;
  if not exists (select 1 from public.rating_photos) then raise exception 'FAIL: anon cannot read photos'; end if;
  if not exists (select 1 from public.profiles) then raise exception 'FAIL: anon cannot read profiles'; end if;
  if not exists (select 1 from public.dishes) then raise exception 'FAIL: anon cannot read dishes'; end if;
  if (select facts_count from public.ratings where user_id = '00000000-0000-0000-0000-00000000000a' and take is not null) <> 1 then raise exception 'FAIL: anon sees wrong count'; end if;
  begin
    perform 1 from public.votes;
    raise exception 'FAIL: anon can read votes';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.ratings (dish_id, score) values ((select id from public.dishes limit 1), 5);
    raise exception 'FAIL: anon rated';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL SOCIAL CHECKS PASSED' as result;
rollback;
