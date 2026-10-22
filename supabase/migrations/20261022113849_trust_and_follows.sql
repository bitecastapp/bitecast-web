-- 1. "Heat" becomes "trust": how much people trust your takes and comments
--    (agrees minus disagrees on your takes, plus likes minus dislikes on your comments).
-- 2. Follows: follow people to get a feed of just their takes.

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles on delete cascade,
  followee_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_id_idx on public.follows (followee_id);

alter table public.follows enable row level security;
revoke all on public.follows from anon, authenticated;
-- Who follows whom is public (counts and lists), like most social apps.
grant select on public.follows to anon, authenticated;
grant insert (followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

create policy "follows are public" on public.follows for select to anon, authenticated using (true);
create policy "users follow as themselves" on public.follows for insert to authenticated
  with check ((select auth.uid()) = follower_id);
create policy "users unfollow for themselves" on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

drop function public.profile_stats(uuid);

create function public.profile_stats(profile_id uuid)
returns table (rated integer, average numeric, trust integer, followers integer, following integer)
language sql stable security invoker set search_path = '' as $$
  select
    (select count(*)::int from public.ratings where user_id = profile_id),
    (select round(avg(score), 1) from public.ratings where user_id = profile_id),
    (select coalesce(sum(net_votes), 0)::int from public.ratings where user_id = profile_id)
      + (select coalesce(sum(like_count - dislike_count), 0)::int from public.comments where user_id = profile_id),
    (select count(*)::int from public.follows where followee_id = profile_id),
    (select count(*)::int from public.follows where follower_id = profile_id);
$$;

revoke execute on function public.profile_stats(uuid) from public;
grant execute on function public.profile_stats(uuid) to anon, authenticated;
