-- Rank against a fixed prior of 7 (weight 5) instead of each list's own average. With few ratings a list's average
-- swings with every new one, and when it ran high a single 10/10 could top the list. With 7: one 10 scores 7.5,
-- four 9s score 7.9.
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
