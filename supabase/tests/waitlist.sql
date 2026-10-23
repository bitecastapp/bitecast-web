-- Waitlist: anyone can add an email, nobody can read the list, one row per email, bad emails refused. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/waitlist.sql
begin;

set local role anon;
do $$
begin
  insert into public.waitlist (email) values ('wl-test@bitecast.test');
  begin
    insert into public.waitlist (email) values ('wl-test@bitecast.test');
    raise exception 'FAIL: duplicate email accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.waitlist (email) values ('not an email');
    raise exception 'FAIL: bad email accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.waitlist (email) values ('Upper@Bitecast.test');
    raise exception 'FAIL: unnormalised email accepted';
  exception when check_violation then null;
  end;
  begin
    perform 1 from public.waitlist;
    raise exception 'FAIL: anon can read the waitlist';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'wl-a@test.local');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$
begin
  begin
    perform 1 from public.waitlist;
    raise exception 'FAIL: signed-in users can read the waitlist';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL WAITLIST CHECKS PASSED' as result;
rollback;
