-- Likes / dislikes on comments. Same shape as votes on takes: individual votes stay private,
-- the counts on each comment are public and kept by a trigger. You can't vote on your own comment.

create table public.comment_votes (
  comment_id uuid not null references public.comments on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_votes_user_id_idx on public.comment_votes (user_id);

alter table public.comments
  add column like_count integer not null default 0, -- maintained by trigger only
  add column dislike_count integer not null default 0;

create function private.sync_comment_vote_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.comments
      set like_count = like_count - (old.kind = 'like')::int,
          dislike_count = dislike_count - (old.kind = 'dislike')::int
      where id = old.comment_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.comments
      set like_count = like_count + (new.kind = 'like')::int,
          dislike_count = dislike_count + (new.kind = 'dislike')::int
      where id = new.comment_id;
  end if;
  return null;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

create trigger comment_votes_sync after insert or update or delete on public.comment_votes
  for each row execute function private.sync_comment_vote_counts();

alter table public.comment_votes enable row level security;
revoke all on public.comment_votes from anon, authenticated;
grant select, delete on public.comment_votes to authenticated;
grant insert (comment_id, kind) on public.comment_votes to authenticated;
grant update (kind) on public.comment_votes to authenticated;

create policy "users see their own comment votes" on public.comment_votes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users vote on others' comments" on public.comment_votes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.comments c where c.id = comment_id and c.user_id = (select auth.uid()))
  );
create policy "users switch their own comment votes" on public.comment_votes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users remove their own comment votes" on public.comment_votes for delete to authenticated
  using ((select auth.uid()) = user_id);
