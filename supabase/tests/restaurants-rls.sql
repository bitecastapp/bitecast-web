-- RLS and duplicate checks for restaurants/dishes. Runs in a transaction and rolls back.
-- Run: pnpm dlx supabase db query --linked -f supabase/tests/restaurants-rls.sql
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'rls-a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'rls-b@test.local');

-- Normaliser cases; apps/web/lib/dishes.test.ts asserts the same pairs.
do $$
declare
  cases text[][] := array[
    ['Masala Dosa', 'masala dosa'],
    ['  Benne  Masala-Dosa ', 'benne masala dosa'],
    ['Ghee Podi Idli!', 'ghee podi idli'],
    ['Brahmin''s Idli', 'brahmin s idli'],
    ['Rava_Idli', 'rava idli'],
    ['ಮಸಾಲೆ  ದೋಸೆ', 'ಮಸಾಲೆ ದೋಸೆ'],
    ['Crème Brûlée', 'crème brûlée'],
    ['Chicken 65 — “Spicy”', 'chicken 65 spicy'],
    ['मसाला डोसा', 'मसाला डोसा']
  ];
  c text[];
  got text;
begin
  foreach c slice 1 in array cases loop
    got := btrim(regexp_replace(lower(c[1]), '[[:space:]!-/:-@[-`{-~’‘“”–—…·]+', ' ', 'g'));
    if got <> c[2] then raise exception 'FAIL: key(%) = %, expected %', c[1], got, c[2]; end if;
  end loop;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  vb uuid := (select id from public.restaurants where slug = 'vidyarthi-bhavan');
  tr uuid := (select id from public.restaurants where slug = 'truffles');
  new_id uuid;
  owner uuid;
begin
  if (select count(*) from public.restaurants) < 10 then raise exception 'FAIL: seed restaurants missing'; end if;

  -- A normal add is stamped with the caller.
  insert into public.dishes (restaurant_id, name) values (vb, 'Uppittu') returning id, created_by into new_id, owner;
  if owner is distinct from '00000000-0000-0000-0000-00000000000a' then raise exception 'FAIL: created_by not the caller'; end if;

  -- Can't claim someone else as creator (column not granted).
  begin
    insert into public.dishes (restaurant_id, name, created_by) values (vb, 'Chow Chow Bath', '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: wrote created_by';
  exception when insufficient_privilege then null;
  end;

  -- Duplicates at the same restaurant, any casing/spacing/punctuation.
  begin
    insert into public.dishes (restaurant_id, name) values (vb, 'masala   DOSA!');
    raise exception 'FAIL: duplicate accepted';
  exception when unique_violation then null;
  end;

  -- Same name at another restaurant is fine.
  insert into public.dishes (restaurant_id, name) values (tr, 'Masala Dosa');

  -- Non-Latin names work and still dedupe.
  insert into public.dishes (restaurant_id, name) values (vb, 'ಮಸಾಲೆ ದೋಸೆ');
  begin
    insert into public.dishes (restaurant_id, name) values (vb, 'ಮಸಾಲೆ  ದೋಸೆ');
    raise exception 'FAIL: Kannada duplicate accepted';
  exception when unique_violation then null;
  end;

  -- Bad names.
  begin
    insert into public.dishes (restaurant_id, name) values (vb, '!!');
    raise exception 'FAIL: punctuation-only name accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.dishes (restaurant_id, name) values (vb, ' Untrimmed');
    raise exception 'FAIL: untrimmed name accepted';
  exception when check_violation then null;
  end;

  -- No edits or deletes from the app.
  begin
    update public.dishes set name = 'Hijacked' where id = new_id;
    raise exception 'FAIL: update allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.dishes where id = new_id;
    raise exception 'FAIL: delete allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.restaurants (slug, name, area) values ('fake', 'Fake', 'Nowhere');
    raise exception 'FAIL: restaurant insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Signed-out visitors: read yes, write no.
reset role;
set local role anon;
do $$
begin
  -- Public to read since 2026-10-21; writing still needs a session.
  if not exists (select 1 from public.restaurants) then raise exception 'FAIL: anon cannot read restaurants'; end if;
  if not exists (select 1 from public.dishes) then raise exception 'FAIL: anon cannot read dishes'; end if;
  begin
    insert into public.dishes (restaurant_id, name) values ((select id from public.restaurants limit 1), 'Anon Dosa');
    raise exception 'FAIL: anon added a dish';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'ALL RESTAURANT CHECKS PASSED' as result;
rollback;
