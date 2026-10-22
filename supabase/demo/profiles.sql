-- Run after seed.sql: pnpm dlx supabase db query --linked -f supabase/demo/profiles.sql (safe to re-run)
-- Demo profiles: names, bios, and each person's best-rated dishes pinned as favourites.
update public.profiles p set display_name = v.name, bio = v.bio
from (values
  ('demo_idli_insider', 'Idli Insider', 'Up before the queue. Soft idlis, hard opinions.'),
  ('demo_hot_takes', 'Hot Takes Hari', 'Someone has to say it.'),
  ('demo_dosa_devotee', 'Dosa Devotee', 'Crisp edges or nothing. Will queue for ghee.'),
  ('demo_biryani_brain', 'Biryani Brain', 'Rice, meat, patience. Ranking every biryani in the city.'),
  ('demo_filter_kaapi', 'Filter Kaapi', 'Decoction runs in the family.'),
  ('demo_late_night', 'Late Night Bites', 'Best food is after midnight.'),
  ('demo_crispy_edges', 'Crispy Edges', 'The edge is the whole point.'),
  ('demo_ghee_please', 'Ghee Please', 'Extra ghee, always.')
) as v(handle, name, bio)
where p.username = v.handle;

delete from public.favourites f using public.profiles p where f.user_id = p.id and p.username like 'demo\_%';
insert into public.favourites (user_id, rating_id, position)
select user_id, id, rn
from (
  select r.user_id, r.id, row_number() over (partition by r.user_id order by r.score desc, r.created_at) as rn
  from public.ratings r join public.profiles p on p.id = r.user_id
  where p.username like 'demo\_%'
) ranked
where rn <= 3;

select count(*) as demo_favourites from public.favourites f join public.profiles p on p.id = f.user_id where p.username like 'demo\_%';

-- Demo follows: each demo user follows the next three (by handle), so counts and the Following feed have something in them.
delete from public.follows f using public.profiles p where f.follower_id = p.id and p.username like 'demo\_%';
insert into public.follows (follower_id, followee_id)
select a.id, b.id
from (select id, row_number() over (order by username) as n, count(*) over () as total from public.profiles where username like 'demo\_%') a
join (select id, row_number() over (order by username) as n from public.profiles where username like 'demo\_%') b
  on b.n in ((a.n % a.total) + 1, ((a.n + 1) % a.total) + 1, ((a.n + 2) % a.total) + 1);

select count(*) as demo_follows from public.follows f join public.profiles p on p.id = f.follower_id where p.username like 'demo\_%';
