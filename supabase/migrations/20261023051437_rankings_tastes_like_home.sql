-- Rankings and Tastes like home (SPEC-rankings.md).
-- 1. More home regions (Bengaluru becomes Karnataka); a home region changes at most once every 30 days.
-- 2. Food lists (the `spaces` table) are fixed: readable by everyone, carry an origin region, and dishes join them
--    automatically by name. People no longer create lists or assign dishes.
-- 3. `dish_rankings`: each listed dish's weighted rank and its Tastes like home score.

-- 1. Regions.
insert into public.regions (slug, name, demonym) values
  ('karnataka', 'Karnataka', 'Kannadigas'),
  ('hyderabad', 'Hyderabad', 'Hyderabadis'),
  ('tamil-nadu', 'Tamil Nadu', 'Tamilians'),
  ('kerala', 'Kerala', 'Malayalis'),
  ('andhra', 'Andhra', 'Andhraites'),
  ('mumbai', 'Mumbai', 'Mumbaikars'),
  ('delhi', 'Delhi', 'Delhiites'),
  ('kolkata', 'Kolkata', 'Kolkatans'),
  ('punjab', 'Punjab', 'Punjabis'),
  ('gujarat', 'Gujarat', 'Gujaratis');

update public.profiles set home_region = 'karnataka' where home_region = 'bengaluru';
delete from public.regions where slug = 'bengaluru';

-- Set by the trigger only (no client grant): when the home region last changed. Null = never changed since signup.
alter table public.profiles add column home_region_changed_at timestamptz;

create function private.limit_home_region_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.home_region is distinct from old.home_region then
    if old.home_region_changed_at > now() - interval '30 days' then
      raise exception 'home region changed in the last 30 days' using errcode = '23514';
    end if;
    new.home_region_changed_at := now();
  end if;
  return new;
end $$;

create trigger profiles_home_region_limit before update of home_region on public.profiles
  for each row execute function private.limit_home_region_change();

-- 2. Food lists.
alter table public.spaces add column origin_region text references public.regions (slug);

update public.spaces s set origin_region = o.region
from (values
  ('Dosa', 'karnataka'), ('Kesari Bath', 'karnataka'), ('Bisi Bele Bath', 'karnataka'), ('Bajji', 'karnataka'),
  ('Idli', 'tamil-nadu'), ('Vada', 'tamil-nadu'), ('Filter Coffee', 'tamil-nadu'),
  ('Biryani', 'hyderabad'),
  ('Ghee Rice', 'kerala')
) as o (name, region)
where s.name = o.name;

alter policy "spaces are readable by signed-in users" on public.spaces rename to "spaces are public";
alter policy "spaces are public" on public.spaces to anon, authenticated;
grant select on public.spaces to anon;

drop policy "users create spaces as themselves" on public.spaces;
revoke insert (name) on public.spaces from authenticated;
drop policy "unassigned dishes can be put in a space once" on public.dishes;
revoke update (space_id) on public.dishes from authenticated;

-- A new dish joins the list whose name appears in its name, longest first ("Benne Masala Dosa" → Dosa).
-- shortcut: plain substring match ("Idli" also matches "Idliyappam"); add a list or fix a row by migration when it misfires.
create function private.place_dish_in_list() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.dishes d
  set space_id = (
    select s.id from public.spaces s
    where position(s.name_key in d.name_key) > 0
    order by char_length(s.name_key) desc, s.name_key
    limit 1
  )
  where d.id = new.id and d.space_id is null;
  return null;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

create trigger dishes_place_in_list after insert on public.dishes
  for each row execute function private.place_dish_in_list();

-- Dishes added so far that aren't in a list yet.
update public.dishes d
set space_id = (
  select s.id from public.spaces s
  where position(s.name_key in d.name_key) > 0
  order by char_length(s.name_key) desc, s.name_key
  limit 1
)
where d.space_id is null;

-- 3. Rankings. Rank = Bayesian average (C = 5, prior = the list's own weighted average), so one 10/10 can't top a list.
-- Ratings from accounts younger than 7 days count half. Unrated dishes get no rank.
-- Tastes like home: the plain average from raters whose home region is the list's origin, shown only from 3 ratings.
-- shortcut: computed on every read; turn into a materialized view or counters once ratings reach the tens of thousands.
create view public.dish_rankings with (security_invoker = true) as
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
  group by d.id, d.space_id
),
scored as (
  select pd.*,
    case when pd.ratings > 0 then
      (5 * coalesce(sum(pd.wsum) over list / nullif(sum(pd.wcount) over list, 0), 7) + pd.wsum) / (5 + pd.wcount)
    end as raw
  from per_dish pd
  window list as (partition by pd.space_id)
)
select dish_id, space_id, ratings,
  round(raw, 2) as rank_score,
  case when raw is not null then (rank() over (partition by space_id order by raw desc nulls last))::int end as rank,
  case when home_count >= 3 then round(home_mean, 1) end as home_avg,
  home_count
from scored;

grant select on public.dish_rankings to anon, authenticated;
