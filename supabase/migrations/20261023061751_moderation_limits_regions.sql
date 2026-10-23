-- Moderation, rate limits and region names.
-- 1. Admins: an admins list and is_admin(); admin-only actions run through logged functions.
-- 2. New dishes wait for approval: visible to their creator (and admins) until approved.
-- 3. Reports: reasons that fit a food platform, and a resolution.
-- 4. Bans: a banned account can't post, vote, follow, save or report.
-- 5. Rate limits on posting.
-- 6. Home regions use proper state names (Andhra → Andhra Pradesh, Hyderabad → Telangana, …).

-- 1. Admins. Added by hand in the database; there's no way to become one from the app.
create table public.admins (
  user_id uuid primary key references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Is the caller an admin? Used in policies, so it runs as the owner (the admins table stays unreadable).
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Every admin action, for accountability.
create table public.moderation_log (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.moderation_log enable row level security;
revoke all on public.moderation_log from anon, authenticated;
grant select on public.moderation_log to authenticated;
create policy "admins read the log" on public.moderation_log for select to authenticated using ((select public.is_admin()));

-- 2. Dish approval. Everything already in the database counts as approved.
alter table public.dishes add column approved_at timestamptz;
update public.dishes set approved_at = created_at;
create index dishes_pending_idx on public.dishes (created_at) where approved_at is null;

alter policy "dishes are public" on public.dishes
  using (approved_at is not null or created_by = (select auth.uid()) or (select public.is_admin()));

-- Dishes added by an admin skip the queue.
create function private.approve_admin_dishes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select public.is_admin()) then
    new.approved_at := now();
  end if;
  return new;
end $$;
create trigger dishes_approve_admin before insert on public.dishes
  for each row execute function private.approve_admin_dishes();

-- Rankings count approved dishes only (same view, one more condition).
create or replace view public.dish_rankings with (security_invoker = true) as
with weighted as (
  select r.dish_id, r.score, p.home_region,
    case when p.created_at > now() - interval '7 days' then 0.5 else 1.0 end as w
  from public.ratings r
  join public.profiles p on p.id = r.user_id
),
per_dish as (
  select d.id as dish_id, d.space_id,
    count(x.score)::int as ratings,
    coalesce(sum(x.w * x.score), 0) as wsum,
    coalesce(sum(x.w), 0) as wcount,
    (count(x.score) filter (where x.home_region = s.origin_region))::int as home_count,
    avg(x.score) filter (where x.home_region = s.origin_region) as home_mean
  from public.dishes d
  join public.spaces s on s.id = d.space_id
  left join weighted x on x.dish_id = d.id
  where d.approved_at is not null
  group by d.id, d.space_id
),
scored as (
  select pd.*, case when pd.ratings > 0 then (5 * 7 + pd.wsum) / (5 + pd.wcount) end as raw
  from per_dish pd
)
select dish_id, space_id, ratings,
  round(raw, 2) as rank_score,
  case when raw is not null then (rank() over (partition by space_id order by raw desc nulls last))::int end as rank,
  case when home_count >= 3 then round(home_mean, 1) end as home_avg,
  home_count
from scored;

-- 3. Reports: reasons per kind of thing, and how a report was settled.
alter table public.reports drop constraint reports_reason_check;
update public.reports set reason = case
  when reason in ('offensive', 'harassment') and target_type <> 'dish' then 'abusive'
  when reason in ('offensive', 'harassment', 'spam') and target_type = 'dish' then 'inappropriate'
  when reason = 'misleading' then case target_type when 'rating' then 'fake' when 'comment' then 'off_topic' else 'not_on_menu' end
  else reason
end;
alter table public.reports add constraint reports_reason_check check (
  (target_type = 'rating' and reason in ('off_topic', 'fake', 'wrong_dish', 'abusive', 'photo', 'spam', 'other'))
  or (target_type = 'comment' and reason in ('abusive', 'spam', 'off_topic', 'other'))
  or (target_type = 'dish' and reason in ('duplicate', 'wrong_place', 'not_on_menu', 'misspelled', 'wrong_diet', 'inappropriate', 'other'))
);
alter table public.reports
  add column resolved_at timestamptz,
  add column resolved_by uuid references public.profiles on delete set null,
  add column resolution text check (resolution in ('removed', 'dismissed'));
create index reports_open_idx on public.reports (created_at) where resolved_at is null;
create policy "admins see every report" on public.reports for select to authenticated using ((select public.is_admin()));

-- 4. Bans. Set only through admin_set_ban (no client grant on these columns).
alter table public.profiles
  add column banned_at timestamptz,
  add column ban_reason text check (char_length(ban_reason) <= 300);

-- Skips writes made by other triggers (counters, cascades), so a banned person can still delete their account.
create function private.block_banned() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 and exists (select 1 from public.profiles where id = (select auth.uid()) and banned_at is not null) then
    raise exception 'account suspended' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;

create trigger ratings_block_banned before insert or update on public.ratings for each row execute function private.block_banned();
create trigger comments_block_banned before insert on public.comments for each row execute function private.block_banned();
create trigger votes_block_banned before insert or update on public.votes for each row execute function private.block_banned();
create trigger comment_votes_block_banned before insert or update on public.comment_votes for each row execute function private.block_banned();
create trigger dishes_block_banned before insert on public.dishes for each row execute function private.block_banned();
create trigger reports_block_banned before insert on public.reports for each row execute function private.block_banned();
create trigger follows_block_banned before insert on public.follows for each row execute function private.block_banned();
create trigger saves_block_banned before insert on public.saves for each row execute function private.block_banned();
create trigger rating_photos_block_banned before insert on public.rating_photos for each row execute function private.block_banned();
create trigger favourites_block_banned before insert on public.favourites for each row execute function private.block_banned();

-- 5. Rate limits: at most N new rows per user per window. Arguments: max, window, owner column.
create function private.rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  recent int;
  me uuid := (select auth.uid());
begin
  if me is null or (select public.is_admin()) then
    return new;
  end if;
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - $2::interval', tg_table_schema, tg_table_name, tg_argv[2])
    into recent using me, tg_argv[1];
  if recent >= tg_argv[0]::int then
    raise exception 'rate limited' using errcode = '54000';
  end if;
  return new;
end $$;

create trigger ratings_rate_limit before insert on public.ratings for each row execute function private.rate_limit('30', '1 hour', 'user_id');
create trigger comments_rate_limit before insert on public.comments for each row execute function private.rate_limit('60', '1 hour', 'user_id');
create trigger dishes_rate_limit before insert on public.dishes for each row execute function private.rate_limit('15', '1 day', 'created_by');
create trigger reports_rate_limit before insert on public.reports for each row execute function private.rate_limit('30', '1 day', 'reporter_id');
create trigger follows_rate_limit before insert on public.follows for each row execute function private.rate_limit('200', '1 day', 'follower_id');

revoke execute on all functions in schema private from public, anon, authenticated;

-- Admin actions. Each checks the caller is an admin, does one thing, and writes the log.
create function private.require_admin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return (select auth.uid());
end $$;
revoke execute on function private.require_admin() from public, anon, authenticated;

create function public.admin_approve_dish(dish uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  update public.dishes set approved_at = now() where id = dish and approved_at is null;
  insert into public.moderation_log (admin_id, action, target_type, target_id) values (me, 'approve', 'dish', dish);
end $$;

-- Delete a take, comment or dish; settles its open reports. Returns photo paths so the app can remove the files.
create function public.admin_delete(target_type text, target uuid, note text default null) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
begin
  if target_type = 'rating' then
    select array_agg(path) into paths from public.rating_photos where rating_id = target;
    delete from public.ratings where id = target;
  elsif target_type = 'comment' then
    delete from public.comments where id = target;
  elsif target_type = 'dish' then
    select array_agg(p.path) into paths from public.rating_photos p join public.ratings r on r.id = p.rating_id where r.dish_id = target;
    delete from public.dishes where id = target;
  else
    raise exception 'unknown target type' using errcode = '22023';
  end if;
  update public.reports set resolved_at = now(), resolved_by = me, resolution = 'removed'
    where reports.target_type = admin_delete.target_type and target_id = target and resolved_at is null;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'delete', target_type, target, jsonb_build_object('note', note));
  return coalesce(paths, '{}');
end $$;

-- Close a thing's open reports without removing it.
create function public.admin_dismiss_reports(target_type text, target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  update public.reports set resolved_at = now(), resolved_by = me, resolution = 'dismissed'
    where reports.target_type = admin_dismiss_reports.target_type and target_id = target and resolved_at is null;
  insert into public.moderation_log (admin_id, action, target_type, target_id) values (me, 'dismiss', target_type, target);
end $$;

-- Ban or unban an account. `purge` also deletes all their takes and comments; returns their photo paths.
create function public.admin_set_ban(account uuid, banned boolean, reason text default null, purge boolean default false) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
begin
  if account = me or exists (select 1 from public.admins where user_id = account) then
    raise exception 'admins can''t be banned' using errcode = '42501';
  end if;
  update public.profiles
    set banned_at = case when banned then now() end,
        ban_reason = case when banned then nullif(btrim(reason), '') end
    where id = account;
  if banned and purge then
    select array_agg(p.path) into paths from public.rating_photos p join public.ratings r on r.id = p.rating_id where r.user_id = account;
    delete from public.ratings where user_id = account;
    delete from public.comments where user_id = account;
  end if;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, case when banned then 'ban' else 'unban' end, 'account', account, jsonb_build_object('reason', reason, 'purge', purge));
  return coalesce(paths, '{}');
end $$;

-- Add a restaurant (admins only; the app makes the slug).
create function public.admin_add_restaurant(slug text, name text, area text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := private.require_admin();
begin
  insert into public.restaurants (slug, name, area) values (slug, btrim(name), btrim(area));
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, 'add', 'restaurant', (select id from public.restaurants r where r.slug = admin_add_restaurant.slug), jsonb_build_object('name', name));
end $$;

revoke execute on function public.admin_approve_dish(uuid), public.admin_delete(text, uuid, text), public.admin_dismiss_reports(text, uuid),
  public.admin_set_ban(uuid, boolean, text, boolean), public.admin_add_restaurant(text, text, text) from public, anon;
grant execute on function public.admin_approve_dish(uuid), public.admin_delete(text, uuid, text), public.admin_dismiss_reports(text, uuid),
  public.admin_set_ban(uuid, boolean, text, boolean), public.admin_add_restaurant(text, text, text) to authenticated;

-- Admins remove photo files of deleted takes (storage needs select + delete).
create policy "admins see all photo objects" on storage.objects for select to authenticated
  using (bucket_id in ('rating-photos', 'avatars') and (select public.is_admin()));
create policy "admins delete photo objects" on storage.objects for delete to authenticated
  using (bucket_id in ('rating-photos', 'avatars') and (select public.is_admin()));

-- 6. Proper region names. New slugs for renamed ones; profiles and food lists move over. The 30-day trigger is
-- paused so this move doesn't count as anyone's change.
insert into public.regions (slug, name, demonym) values
  ('andhra-pradesh', 'Andhra Pradesh', 'Andhraites'),
  ('telangana', 'Telangana', 'Telanganites'),
  ('maharashtra', 'Maharashtra', 'Maharashtrians'),
  ('west-bengal', 'West Bengal', 'Bengalis');

alter table public.profiles disable trigger profiles_home_region_limit;
update public.profiles set home_region = case home_region
  when 'andhra' then 'andhra-pradesh' when 'hyderabad' then 'telangana' when 'mumbai' then 'maharashtra' when 'kolkata' then 'west-bengal'
end where home_region in ('andhra', 'hyderabad', 'mumbai', 'kolkata');
alter table public.profiles enable trigger profiles_home_region_limit;

update public.spaces set origin_region = case origin_region
  when 'andhra' then 'andhra-pradesh' when 'hyderabad' then 'telangana' when 'mumbai' then 'maharashtra' when 'kolkata' then 'west-bengal'
end where origin_region in ('andhra', 'hyderabad', 'mumbai', 'kolkata');

delete from public.regions where slug in ('andhra', 'hyderabad', 'mumbai', 'kolkata');
update public.regions set name = 'Delhi NCR' where slug = 'delhi';
