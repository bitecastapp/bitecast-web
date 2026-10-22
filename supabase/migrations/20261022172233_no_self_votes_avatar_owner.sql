-- 1. No voting on your own takes or comments again: self-votes inflated Trust. Existing self-votes are removed
--    (the vote triggers bring the counts back down).
-- 2. A profile photo must live in its owner's folder, so nobody can show someone else's photo as theirs.

-- 1. Self-votes.
drop policy "users vote as themselves" on public.votes;
create policy "users vote on others' ratings" on public.votes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.ratings r where r.id = rating_id and r.user_id = (select auth.uid()))
  );

drop policy "users vote on comments as themselves" on public.comment_votes;
create policy "users vote on others' comments" on public.comment_votes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.comments c where c.id = comment_id and c.user_id = (select auth.uid()))
  );

delete from public.votes v using public.ratings r where r.id = v.rating_id and r.user_id = v.user_id;
delete from public.comment_votes v using public.comments c where c.id = v.comment_id and c.user_id = v.user_id;

-- 2. Profile photo ownership.
alter table public.profiles
  add constraint profiles_avatar_path_owner check (split_part(avatar_path, '/', 1) = id::text);
