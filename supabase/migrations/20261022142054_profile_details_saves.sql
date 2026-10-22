-- Profile details (public: pronouns, food preference, Instagram, profile photo),
-- private details only the owner can read (date of birth, gender), and "Want to try" saves.

-- Public details.
alter table public.profiles
  add column pronouns text check (pronouns = btrim(pronouns) and char_length(pronouns) between 1 and 20),
  add column diet text check (diet in ('veg', 'eggetarian', 'vegan', 'non_veg')),
  add column instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  -- An uploaded photo in the avatars bucket, under the owner's folder. Null = their food character.
  add column avatar_path text check (avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$');

grant update (pronouns, diet, instagram, avatar_path) on public.profiles to authenticated;

-- Private details live in their own table: profiles is public-readable, this is owner-only.
create table public.profile_private (
  user_id uuid primary key default auth.uid() references public.profiles on delete cascade,
  date_of_birth date check (date_of_birth >= date '1900-01-01'),
  gender text check (gender in ('woman', 'man', 'non_binary', 'prefer_not_to_say'))
);

-- You must be 13 or older; checked on write (a CHECK can't use today's date).
create function private.check_profile_age() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.date_of_birth is not null and new.date_of_birth > (current_date - interval '13 years')::date then
    raise exception 'must be at least 13' using errcode = '23514';
  end if;
  return new;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

create trigger profile_private_age before insert or update on public.profile_private
  for each row execute function private.check_profile_age();

alter table public.profile_private enable row level security;
revoke all on public.profile_private from anon, authenticated;
grant select on public.profile_private to authenticated;
grant insert (date_of_birth, gender) on public.profile_private to authenticated;
grant update (date_of_birth, gender) on public.profile_private to authenticated;

create policy "users read their own private details" on public.profile_private for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users add their own private details" on public.profile_private for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users edit their own private details" on public.profile_private for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- "Want to try": dishes saved for later. Public, like a Letterboxd watchlist.
create table public.saves (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  dish_id uuid not null references public.dishes on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create index saves_dish_id_idx on public.saves (dish_id);

alter table public.saves enable row level security;
revoke all on public.saves from anon, authenticated;
grant select on public.saves to anon, authenticated;
grant insert (dish_id) on public.saves to authenticated;
grant delete on public.saves to authenticated;

create policy "saves are public" on public.saves for select to anon, authenticated using (true);
create policy "users save for themselves" on public.saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users unsave their own" on public.saves for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Profile photos: public-read bucket, 1 MB, JPEG/WebP; people write only into their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "users upload avatars to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete their own avatars" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users see their own avatar objects" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
