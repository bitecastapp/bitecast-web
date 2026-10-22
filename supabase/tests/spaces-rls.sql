-- RLS checks for Spaces and dish assignment. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/spaces-rls.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  vb uuid := (select id from public.restaurants where slug = 'vidyarthi-bhavan');
  dosa uuid := (select id from public.spaces where name = 'Dosa');
  new_space uuid;
  owner uuid;
  new_dish uuid;
  n int;
begin
  if (select count(*) from public.spaces where created_by is null) <> 12 then raise exception 'FAIL: expected 12 seed spaces'; end if;
  if exists (select 1 from public.dishes where created_by is null and space_id is null) then
    raise exception 'FAIL: a seeded dish has no space';
  end if;

  -- Create a Space; it is stamped with the caller.
  insert into public.spaces (name) values ('Set Dosa') returning id, created_by into new_space, owner;
  if owner is distinct from '00000000-0000-0000-0000-00000000000a' then raise exception 'FAIL: space created_by not the caller'; end if;

  -- Duplicate names, any casing/punctuation.
  begin
    insert into public.spaces (name) values ('  dosa! ');
    raise exception 'FAIL: untrimmed duplicate accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.spaces (name) values ('DOSA');
    raise exception 'FAIL: duplicate space accepted';
  exception when unique_violation then null;
  end;

  -- Can't set created_by or edit/delete Spaces.
  begin
    insert into public.spaces (name, created_by) values ('Pongal', null);
    raise exception 'FAIL: wrote space created_by';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.spaces set name = 'Hijacked' where id = dosa;
    raise exception 'FAIL: space update allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.spaces where id = new_space;
    raise exception 'FAIL: space delete allowed';
  exception when insufficient_privilege then null;
  end;

  -- Assign an unassigned dish once.
  insert into public.dishes (restaurant_id, name, veg) values (vb, 'Plain Dosa', true) returning id into new_dish;
  update public.dishes set space_id = dosa where id = new_dish;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: could not assign an unassigned dish'; end if;

  -- Reassigning is silently blocked by RLS (0 rows).
  update public.dishes set space_id = new_space where id = new_dish;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: reassigned a dish'; end if;
  if (select space_id from public.dishes where id = new_dish) <> dosa then raise exception 'FAIL: space changed'; end if;

  -- Seeded (already assigned) dishes can't be moved either.
  update public.dishes set space_id = new_space where name = 'Masala Dosa';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: moved a seeded dish'; end if;

  -- Unassigning (back to null) is refused.
  insert into public.dishes (restaurant_id, name, veg) values (vb, 'Onion Dosa', true) returning id into new_dish;
  begin
    update public.dishes set space_id = null where id = new_dish;
    raise exception 'FAIL: set space to null';
  exception when insufficient_privilege then null;
  end;

  -- No other dish column is writable.
  begin
    update public.dishes set name = 'Renamed' where id = new_dish;
    raise exception 'FAIL: dish rename allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role anon;
do $$
begin
  perform 1 from public.spaces;
  raise exception 'FAIL: anon can read spaces';
exception when insufficient_privilege then null;
end $$;

select 'ALL SPACES CHECKS PASSED' as result;
rollback;
