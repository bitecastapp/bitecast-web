-- Social core, slice (a): ratings (score + optional take), photos, Facts/Cap votes, public read.

-- Public read: dish pages, reviews, profiles and the feed are visible to signed-out visitors.
alter policy "profiles are readable by signed-in users" on public.profiles rename to "profiles are public";
alter policy "profiles are public" on public.profiles to anon, authenticated;
alter policy "restaurants are readable by signed-in users" on public.restaurants rename to "restaurants are public";
alter policy "restaurants are public" on public.restaurants to anon, authenticated;
alter policy "dishes are readable by signed-in users" on public.dishes rename to "dishes are public";
alter policy "dishes are public" on public.dishes to anon, authenticated;
grant select on public.profiles, public.restaurants, public.dishes to anon;

-- Ratings: one per user per dish. A rating with a take is a review.
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  dish_id uuid not null references public.dishes on delete cascade,
  score smallint not null check (score between 1 and 10),
  take text check (take is null or (take = btrim(take) and char_length(take) between 1 and 500)),
  facts_count integer not null default 0, -- maintained by the votes trigger only
  cap_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dish_id)
);

create index ratings_dish_id_idx on public.ratings (dish_id);
create index ratings_new_idx on public.ratings (created_at desc) where take is not null;
create index ratings_top_idx on public.ratings ((facts_count - cap_count) desc, created_at desc) where take is not null;

create table public.rating_photos (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings on delete cascade,
  path text not null unique check (path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$'),
  position smallint not null check (position between 1 and 4),
  unique (rating_id, position)
);

create table public.votes (
  rating_id uuid not null references public.ratings on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('facts', 'cap')),
  created_at timestamptz not null default now(),
  primary key (rating_id, user_id)
);

create index votes_user_id_idx on public.votes (user_id);

-- Private helpers: not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger ratings_touch before update on public.ratings
  for each row execute function private.touch_updated_at();

-- Keeps ratings.facts_count / cap_count in step with votes. Runs as owner so counts stay public
-- while individual votes stay private.
create function private.sync_vote_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.ratings
      set facts_count = facts_count - (old.kind = 'facts')::int,
          cap_count = cap_count - (old.kind = 'cap')::int
      where id = old.rating_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.ratings
      set facts_count = facts_count + (new.kind = 'facts')::int,
          cap_count = cap_count + (new.kind = 'cap')::int
      where id = new.rating_id;
  end if;
  return null;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

create trigger votes_sync after insert or update or delete on public.votes
  for each row execute function private.sync_vote_counts();

-- Grants: exactly what the app needs. Counters are never client-writable.
alter table public.ratings enable row level security;
alter table public.rating_photos enable row level security;
alter table public.votes enable row level security;

revoke all on public.ratings, public.rating_photos, public.votes from anon, authenticated;
grant select on public.ratings, public.rating_photos to anon, authenticated;
grant insert (dish_id, score, take) on public.ratings to authenticated;
grant update (score, take) on public.ratings to authenticated;
grant delete on public.ratings to authenticated;
grant insert (rating_id, path, position) on public.rating_photos to authenticated;
grant delete on public.rating_photos to authenticated;
grant select, delete on public.votes to authenticated;
grant insert (rating_id, kind) on public.votes to authenticated;
grant update (kind) on public.votes to authenticated;

create policy "ratings are public" on public.ratings for select to anon, authenticated using (true);
create policy "users rate as themselves" on public.ratings for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users edit their own ratings" on public.ratings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete their own ratings" on public.ratings for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "rating photos are public" on public.rating_photos for select to anon, authenticated using (true);
create policy "users add photos to their own ratings" on public.rating_photos for insert to authenticated
  with check (
    path like (select auth.uid())::text || '/%'
    and exists (select 1 from public.ratings r where r.id = rating_id and r.user_id = (select auth.uid()))
  );
create policy "users remove photos from their own ratings" on public.rating_photos for delete to authenticated
  using (exists (select 1 from public.ratings r where r.id = rating_id and r.user_id = (select auth.uid())));

create policy "users see their own votes" on public.votes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users vote on others' ratings" on public.votes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.ratings r where r.id = rating_id and r.user_id = (select auth.uid()))
  );
create policy "users switch their own votes" on public.votes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users remove their own votes" on public.votes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Storage: public-read photo bucket; users upload only into their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rating-photos', 'rating-photos', true, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "users upload rating photos to their folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'rating-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete their own rating photos" on storage.objects for delete to authenticated
  using (bucket_id = 'rating-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Storage deletes need a matching select policy on the user's own objects.
create policy "users see their own rating photo objects" on storage.objects for select to authenticated
  using (bucket_id = 'rating-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
