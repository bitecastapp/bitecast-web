-- 1. Vegan joins veg / egg / non_veg on dishes, and "vegan only" joins the show-dishes preference.
-- 2. Every dish keeps its overall score (count + average of everyone's ratings), kept by a trigger.
-- 3. People may vote on their own takes and comments.
-- 4. Gender reads female / male (was woman / man); pronouns are dropped.

-- 1. Diets.
alter table public.dishes drop constraint dishes_diet_check;
alter table public.dishes add constraint dishes_diet_check check (diet in ('veg', 'vegan', 'egg', 'non_veg'));

alter table public.profile_private drop constraint profile_private_show_diet_check;
-- 'vegan' = vegan dishes only; 'veg' = vegetarian (incl. vegan); 'egg' = vegetarian + egg; 'all' = everything.
alter table public.profile_private add constraint profile_private_show_diet_check check (show_diet in ('all', 'vegan', 'veg', 'egg'));

-- 2. Overall score per dish.
alter table public.dishes
  add column rating_count integer not null default 0, -- maintained by trigger only
  add column rating_sum numeric(10,1) not null default 0,
  add column avg_score numeric(3,1) generated always as (case when rating_count > 0 then round(rating_sum / rating_count, 1) end) stored;

create function private.sync_dish_score() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.dishes set rating_count = rating_count - 1, rating_sum = rating_sum - old.score where id = old.dish_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.dishes set rating_count = rating_count + 1, rating_sum = rating_sum + new.score where id = new.dish_id;
  end if;
  return null;
end $$;

revoke execute on all functions in schema private from public, anon, authenticated;

create trigger ratings_sync_dish_score after insert or delete or update of score, dish_id on public.ratings
  for each row execute function private.sync_dish_score();

update public.dishes d set rating_count = s.n, rating_sum = s.total
from (select dish_id, count(*) as n, sum(score) as total from public.ratings group by dish_id) s
where s.dish_id = d.id;

-- 3. Self-votes allowed: you vote as yourself, on anything.
drop policy "users vote on others' ratings" on public.votes;
create policy "users vote as themselves" on public.votes for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy "users vote on others' comments" on public.comment_votes;
create policy "users vote on comments as themselves" on public.comment_votes for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- 4. Gender wording, and no pronouns.
alter table public.profile_private drop constraint profile_private_gender_check;
update public.profile_private set gender = case gender when 'woman' then 'female' when 'man' then 'male' else gender end;
alter table public.profile_private add constraint profile_private_gender_check check (gender in ('female', 'male', 'non_binary', 'prefer_not_to_say'));

alter table public.profiles drop column pronouns;
