-- RLS checks for profiles. Runs in a transaction and rolls back, so it leaves no data.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/rls.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local');

set local role authenticated;

-- Act as user A.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

insert into public.profiles (id, username, home_region)
  values ('00000000-0000-0000-0000-00000000000a', 'rls_user_a', 'bengaluru');

do $$
begin
  -- A cannot create a profile for B.
  begin
    insert into public.profiles (id, username, home_region)
      values ('00000000-0000-0000-0000-00000000000b', 'rls_user_b', 'bengaluru');
    raise exception 'FAIL: A created a profile for B';
  exception when insufficient_privilege then null;
  end;

  -- Invalid usernames are rejected.
  begin
    update public.profiles set username = 'Bad Name!' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: invalid username accepted';
  exception when check_violation then null;
  end;

  -- Unknown region is rejected.
  begin
    update public.profiles set home_region = 'atlantis' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: unknown region accepted';
  exception when foreign_key_violation then null;
  end;

  -- created_at is not writable by users.
  begin
    update public.profiles set created_at = now() - interval '1 year' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: created_at writable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Act as user B.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

do $$
declare n int;
begin
  -- B cannot change A's profile (RLS hides the row, so 0 rows update).
  update public.profiles set username = 'hijacked' where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B updated A''s profile'; end if;

  -- Duplicate username is rejected.
  begin
    insert into public.profiles (id, username, home_region)
      values ('00000000-0000-0000-0000-00000000000b', 'rls_user_a', 'bengaluru');
    raise exception 'FAIL: duplicate username accepted';
  exception when unique_violation then null;
  end;
end $$;

-- Anonymous visitors cannot read profiles.
reset role;
set local role anon;
do $$
begin
  perform 1 from public.profiles;
  raise exception 'FAIL: anon can read profiles';
exception when insufficient_privilege then null;
end $$;

select 'ALL RLS CHECKS PASSED' as result;
rollback;
