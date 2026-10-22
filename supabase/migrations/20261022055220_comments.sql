-- Comments on takes: top-level comments plus one level of replies. Delete your own; no editing.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  parent_id uuid references public.comments on delete cascade, -- null = top-level; replies go one level deep
  body text not null check (body = btrim(body) and char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_rating_id_idx on public.comments (rating_id, created_at);
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_user_id_idx on public.comments (user_id);

alter table public.ratings add column comments_count integer not null default 0; -- maintained by trigger only

-- A reply must point at a top-level comment on the same take.
create function private.check_comment_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  parent public.comments;
begin
  if new.parent_id is null then
    return new;
  end if;
  select * into parent from public.comments where id = new.parent_id;
  if parent.id is null or parent.rating_id <> new.rating_id then
    raise exception 'reply must belong to the same take' using errcode = '23514';
  end if;
  if parent.parent_id is not null then
    raise exception 'replies go one level deep' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger comments_check_parent before insert on public.comments
  for each row execute function private.check_comment_parent();

-- Keeps ratings.comments_count in step (counts replies too).
create function private.sync_comment_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.ratings set comments_count = comments_count + 1 where id = new.rating_id;
  else
    update public.ratings set comments_count = greatest(comments_count - 1, 0) where id = old.rating_id;
  end if;
  return null;
end $$;

create trigger comments_sync_count after insert or delete on public.comments
  for each row execute function private.sync_comment_count();

revoke execute on all functions in schema private from public, anon, authenticated;

alter table public.comments enable row level security;
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (rating_id, parent_id, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

create policy "comments are public" on public.comments for select to anon, authenticated using (true);
create policy "users comment as themselves" on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users delete their own comments" on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);
