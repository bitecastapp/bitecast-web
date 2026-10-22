-- Profiles get a display name, a bio and an avatar; people pin up to 4 favourite dishes; stats and karma per profile.

alter table public.profiles
  add column display_name text check (display_name = btrim(display_name) and char_length(display_name) between 1 and 40),
  add column bio text check (bio = btrim(bio) and char_length(bio) between 1 and 160),
  -- Avatar traits as 4 base-36 digits (shape, colour, eyes, mouth). Null = generated from the handle in the app.
  add column avatar text check (avatar ~ '^[0-9a-z]{4}$');

grant update (display_name, bio, avatar) on public.profiles to authenticated;

-- Favourites point at the person's own ratings, so you can only pin dishes you've actually rated,
-- and deleting a rating unpins it.
create table public.favourites (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  rating_id uuid not null references public.ratings on delete cascade,
  position smallint not null check (position between 1 and 4),
  primary key (user_id, position),
  unique (user_id, rating_id)
);

create index favourites_rating_id_idx on public.favourites (rating_id);

alter table public.favourites enable row level security;
revoke all on public.favourites from anon, authenticated;
grant select on public.favourites to anon, authenticated;
grant insert (rating_id, position) on public.favourites to authenticated;
grant delete on public.favourites to authenticated;

create policy "favourites are public" on public.favourites for select to anon, authenticated using (true);
create policy "users pin their own ratings" on public.favourites for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.ratings r where r.id = rating_id and r.user_id = (select auth.uid()))
  );
create policy "users unpin their own favourites" on public.favourites for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Replace your favourites in one go (all or nothing), in the order given. Runs as the caller, so RLS applies.
create function public.set_favourites(rating_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if coalesce(array_length(rating_ids, 1), 0) > 4 then
    raise exception 'at most 4 favourites' using errcode = '23514';
  end if;
  delete from public.favourites where user_id = (select auth.uid());
  insert into public.favourites (rating_id, position)
  select id, ord from unnest(rating_ids) with ordinality as t(id, ord);
end $$;

revoke execute on function public.set_favourites(uuid[]) from public, anon;
grant execute on function public.set_favourites(uuid[]) to authenticated;

-- A profile's numbers: dishes rated, average score, and karma
-- (agrees minus disagrees on their takes, plus likes minus dislikes on their comments).
create function public.profile_stats(profile_id uuid)
returns table (rated integer, average numeric, karma integer)
language sql stable security invoker set search_path = '' as $$
  select
    (select count(*)::int from public.ratings where user_id = profile_id),
    (select round(avg(score), 1) from public.ratings where user_id = profile_id),
    (select coalesce(sum(net_votes), 0)::int from public.ratings where user_id = profile_id)
      + (select coalesce(sum(like_count - dislike_count), 0)::int from public.comments where user_id = profile_id);
$$;

revoke execute on function public.profile_stats(uuid) from public;
grant execute on function public.profile_stats(uuid) to anon, authenticated;
