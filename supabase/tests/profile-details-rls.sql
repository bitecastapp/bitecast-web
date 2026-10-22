-- Checks for public profile details, owner-only private details, and "Want to try" saves. Rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/profile-details-rls.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local');
insert into public.profiles (id, username, home_region) values
  ('00000000-0000-0000-0000-00000000000a', 'rls_a', 'bengaluru'),
  ('00000000-0000-0000-0000-00000000000b', 'rls_b', 'bengaluru');

set local role authenticated;

-- A fills in details.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$
begin
  update public.profiles set diet = 'eggetarian', instagram = 'asha.eats',
    avatar_path = '00000000-0000-0000-0000-00000000000a/me.jpg'
    where id = '00000000-0000-0000-0000-00000000000a';
  begin
    update public.profiles set avatar_path = '00000000-0000-0000-0000-00000000000b/them.jpg' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: someone else''s photo accepted';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set instagram = 'not a handle!' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: bad instagram accepted';
  exception when check_violation then null;
  end;
  begin
    update public.profiles set diet = 'carnivore' where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: bad diet accepted';
  exception when check_violation then null;
  end;

  -- What the app sends (PostgREST upsert): insert, then the same again updates in place.
  insert into public.profile_private (date_of_birth, gender) values ('2001-05-04', 'female')
    on conflict (user_id) do update set date_of_birth = excluded.date_of_birth, gender = excluded.gender;
  insert into public.profile_private (date_of_birth, gender) values ('2001-05-05', 'prefer_not_to_say')
    on conflict (user_id) do update set date_of_birth = excluded.date_of_birth, gender = excluded.gender;
  if (select gender from public.profile_private) <> 'prefer_not_to_say' or (select count(*) from public.profile_private) <> 1 then
    raise exception 'FAIL: upsert of private details';
  end if;
  -- Preferences default sensibly, save, and reject unknown values.
  if (select show_diet from public.profile_private) <> 'all' or (select feed_default from public.profile_private) <> 'top' then
    raise exception 'FAIL: preference defaults';
  end if;
  update public.profile_private set show_diet = 'egg', feed_default = 'following' where user_id = '00000000-0000-0000-0000-00000000000a';
  begin
    update public.profile_private set show_diet = 'meat' where user_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: bad show_diet accepted';
  exception when check_violation then null;
  end;
  begin
    update public.profile_private set date_of_birth = current_date - 365 where user_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: under-13 birthday accepted';
  exception when check_violation then null;
  end;
  begin
    update public.profile_private set gender = 'robot' where user_id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FAIL: bad gender accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.profile_private (user_id, gender) values ('00000000-0000-0000-0000-00000000000b', 'male');
    raise exception 'FAIL: wrote someone else''s private details';
  exception when insufficient_privilege then null;
  end;

  insert into public.saves (dish_id) values ((select id from public.dishes where name = 'Masala Dosa' limit 1));
  begin
    insert into public.saves (dish_id) values ((select id from public.dishes where name = 'Masala Dosa' limit 1));
    raise exception 'FAIL: saved twice';
  exception when unique_violation then null;
  end;
end $$;

-- B can't see A's private details, change them, or remove A's save.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  if exists (select 1 from public.profile_private) then raise exception 'FAIL: B can read A''s private details'; end if;
  update public.profile_private set gender = 'male' where user_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B edited A''s private details'; end if;
  delete from public.saves where user_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B removed A''s save'; end if;
  if (select instagram from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'asha.eats' then
    raise exception 'FAIL: public details not readable';
  end if;
end $$;

-- Signed out: public details and saves yes, private details never.
reset role;
set local role anon;
do $$
begin
  if not exists (select 1 from public.saves) then raise exception 'FAIL: anon cannot read saves'; end if;
  begin
    perform 1 from public.profile_private;
    raise exception 'FAIL: anon read private details';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.saves (dish_id) values ((select id from public.dishes limit 1));
    raise exception 'FAIL: anon saved';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL PROFILE DETAIL CHECKS PASSED' as result;
rollback;
