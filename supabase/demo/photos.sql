-- Attach demo photos to demo takes. Safe to re-run; run after seed.sql.
-- The files live in Storage under one fixed folder (photo paths must start with a uuid-shaped folder);
-- sources and credits: supabase/demo/photos/, supabase/demo/PHOTO-CREDITS.md. Upload them once:
--   pnpm dlx supabase storage cp -r supabase/demo/photos ss:///rating-photos/00000000-0000-0000-0000-0000000000de --linked --experimental
delete from public.rating_photos where path like '00000000-0000-0000-0000-0000000000de/%';

insert into public.rating_photos (rating_id, path, position)
select r.id, '00000000-0000-0000-0000-0000000000de/' || v.file, v.position
from (values
  ('demo_dosa_devotee', 'vidyarthi-bhavan', 'Masala Dosa', 'masala-dosa-1.jpg', 1),
  ('demo_dosa_devotee', 'vidyarthi-bhavan', 'Masala Dosa', 'masala-dosa-2.jpg', 2),
  ('demo_hot_takes', 'vidyarthi-bhavan', 'Masala Dosa', 'masala-dosa-3.jpg', 1),
  ('demo_crispy_edges', 'ctr', 'Benne Masala Dosa', 'benne-dosa.jpg', 1),
  ('demo_idli_insider', 'the-rameshwaram-cafe', 'Ghee Podi Idli', 'podi-idli.jpg', 1),
  ('demo_idli_insider', 'brahmins-coffee-bar', 'Idli', 'idli-plate.jpg', 1),
  ('demo_biryani_brain', 'meghana-foods', 'Chicken Biryani', 'biryani-1.jpg', 1),
  ('demo_biryani_brain', 'meghana-foods', 'Chicken Biryani', 'biryani-2.jpg', 2),
  ('demo_biryani_brain', 'shivaji-military-hotel', 'Mutton Donne Biryani', 'donne-biryani.jpg', 1),
  ('demo_filter_kaapi', 'brahmins-coffee-bar', 'Filter Coffee', 'filter-coffee.jpg', 1),
  ('demo_crispy_edges', 'truffles', 'All American Cheeseburger', 'cheeseburger.jpg', 1)
) as v (handle, slug, dish, file, position)
join public.profiles p on p.username = v.handle
join public.restaurants rest on rest.slug = v.slug
join public.dishes d on d.restaurant_id = rest.id and d.name = v.dish
join public.ratings r on r.user_id = p.id and r.dish_id = d.id;

select count(*) as demo_photos from public.rating_photos where path like '00000000-0000-0000-0000-0000000000de/%';
