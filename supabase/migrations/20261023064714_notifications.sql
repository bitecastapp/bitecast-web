-- In-app notifications: someone agreed with your take, commented or replied, followed you; your dish was approved;
-- a moderator removed your take or comment. Written only by triggers and admin functions; you read and clear yours.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade, -- who it's for
  actor_id uuid references public.profiles on delete cascade, -- who did it; null = Bitecast (moderation)
  kind text not null check (kind in ('agree', 'comment', 'reply', 'follow', 'dish_approved', 'dish_removed', 'take_removed', 'comment_removed')),
  rating_id uuid references public.ratings on delete cascade,
  comment_id uuid references public.comments on delete cascade,
  dish_id uuid references public.dishes on delete cascade,
  detail text check (char_length(detail) <= 200), -- e.g. the dish a removed take was about
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index notifications_actor_idx on public.notifications (actor_id);
create index notifications_rating_idx on public.notifications (rating_id);
create index notifications_comment_idx on public.notifications (comment_id);
create index notifications_dish_idx on public.notifications (dish_id);
-- One "agreed" per person per take and one "followed" per person, however often they toggle.
create unique index notifications_once_idx on public.notifications (user_id, actor_id, kind, rating_id) nulls not distinct
  where kind in ('agree', 'follow');

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "users read their notifications" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users mark their notifications read" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users clear their notifications" on public.notifications for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Agree ("facts") on someone's take.
create function private.notify_agree() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner uuid;
begin
  if new.kind <> 'facts' then return null; end if;
  select user_id into owner from public.ratings where id = new.rating_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, kind, rating_id) values (owner, new.user_id, 'agree', new.rating_id)
      on conflict do nothing;
  end if;
  return null;
end $$;
create trigger votes_notify after insert or update of kind on public.votes for each row execute function private.notify_agree();

-- A comment on your take, or a reply to your comment (the take's owner hears about replies too).
create function private.notify_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare take_owner uuid; parent_author uuid;
begin
  select user_id into take_owner from public.ratings where id = new.rating_id;
  if new.parent_id is not null then
    select user_id into parent_author from public.comments where id = new.parent_id;
    if parent_author is not null and parent_author <> new.user_id then
      insert into public.notifications (user_id, actor_id, kind, rating_id, comment_id) values (parent_author, new.user_id, 'reply', new.rating_id, new.id);
    end if;
  end if;
  if take_owner is not null and take_owner <> new.user_id and take_owner is distinct from parent_author then
    insert into public.notifications (user_id, actor_id, kind, rating_id, comment_id) values (take_owner, new.user_id, 'comment', new.rating_id, new.id);
  end if;
  return null;
end $$;
create trigger comments_notify after insert on public.comments for each row execute function private.notify_comment();

create function private.notify_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, kind) values (new.followee_id, new.follower_id, 'follow') on conflict do nothing;
  return null;
end $$;
create trigger follows_notify after insert on public.follows for each row execute function private.notify_follow();

revoke execute on all functions in schema private from public, anon, authenticated;

-- Approving a dish tells the person who added it.
create or replace function public.admin_approve_dish(dish uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  creator uuid;
begin
  update public.dishes set approved_at = now() where id = dish and approved_at is null returning created_by into creator;
  if creator is not null then
    insert into public.notifications (user_id, kind, dish_id) values (creator, 'dish_approved', dish);
  end if;
  insert into public.moderation_log (admin_id, action, target_type, target_id) values (me, 'approve', 'dish', dish);
end $$;

-- Removing a take, comment or dish tells its author (what was removed, since the item itself is gone).
create or replace function public.admin_delete(target_type text, target uuid, note text default null) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
  author uuid;
  about text;
  about_dish uuid;
begin
  if target_type = 'rating' then
    select r.user_id, d.name, d.id into author, about, about_dish from public.ratings r join public.dishes d on d.id = r.dish_id where r.id = target;
    select array_agg(path) into paths from public.rating_photos where rating_id = target;
    delete from public.ratings where id = target;
    if author is not null then
      insert into public.notifications (user_id, kind, dish_id, detail) values (author, 'take_removed', about_dish, left(about, 200));
    end if;
  elsif target_type = 'comment' then
    select c.user_id, d.name, d.id into author, about, about_dish
      from public.comments c join public.ratings r on r.id = c.rating_id join public.dishes d on d.id = r.dish_id where c.id = target;
    delete from public.comments where id = target;
    if author is not null then
      insert into public.notifications (user_id, kind, dish_id, detail) values (author, 'comment_removed', about_dish, left(about, 200));
    end if;
  elsif target_type = 'dish' then
    select created_by, name into author, about from public.dishes where id = target;
    select array_agg(p.path) into paths from public.rating_photos p join public.ratings r on r.id = p.rating_id where r.dish_id = target;
    delete from public.dishes where id = target;
    if author is not null and author <> me then
      insert into public.notifications (user_id, kind, detail) values (author, 'dish_removed', left(about, 200));
    end if;
  else
    raise exception 'unknown target type' using errcode = '22023';
  end if;
  update public.reports set resolved_at = now(), resolved_by = me, resolution = 'removed'
    where reports.target_type = admin_delete.target_type and target_id = target and resolved_at is null;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'delete', target_type, target, jsonb_build_object('note', note));
  return coalesce(paths, '{}');
end $$;
