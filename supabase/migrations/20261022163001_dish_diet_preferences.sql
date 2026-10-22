-- 1. Dishes say what they are: veg, egg or non_veg (was a veg yes/no that lumped egg in with meat).
-- 2. Personal preferences (owner-only): which dishes to show, and which feed opens by default.

alter table public.dishes add column diet text check (diet in ('veg', 'egg', 'non_veg'));
update public.dishes set diet = case when veg then 'veg' else 'non_veg' end;
alter table public.dishes alter column diet set not null;
alter table public.dishes drop column veg;

grant insert (diet) on public.dishes to authenticated;

alter table public.profile_private
  -- 'all' = everything, 'veg' = vegetarian dishes only, 'egg' = vegetarian and egg dishes.
  add column show_diet text not null default 'all' check (show_diet in ('all', 'veg', 'egg')),
  add column feed_default text not null default 'top' check (feed_default in ('top', 'new', 'following'));

grant insert (show_diet, feed_default) on public.profile_private to authenticated;
grant update (show_diet, feed_default) on public.profile_private to authenticated;
