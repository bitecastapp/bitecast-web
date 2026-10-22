-- "Karma" becomes "heat": how much your takes and comments heat up
-- (agrees minus disagrees on your takes, plus likes minus dislikes on your comments). Same maths, Bitecast's own name.

drop function public.profile_stats(uuid);

create function public.profile_stats(profile_id uuid)
returns table (rated integer, average numeric, heat integer)
language sql stable security invoker set search_path = '' as $$
  select
    (select count(*)::int from public.ratings where user_id = profile_id),
    (select round(avg(score), 1) from public.ratings where user_id = profile_id),
    (select coalesce(sum(net_votes), 0)::int from public.ratings where user_id = profile_id)
      + (select coalesce(sum(like_count - dislike_count), 0)::int from public.comments where user_id = profile_id);
$$;

revoke execute on function public.profile_stats(uuid) from public;
grant execute on function public.profile_stats(uuid) to anon, authenticated;
