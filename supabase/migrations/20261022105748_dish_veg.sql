-- Veg or non-veg on every dish (true = veg). Required: whoever adds a dish says which it is.
-- Egg dishes count as non-veg, as on Indian menus.

alter table public.dishes add column veg boolean;

update public.dishes d set veg = not exists (
  select 1 from public.restaurants r
  where r.id = d.restaurant_id
    and (r.slug, d.name) in (
      ('empire-restaurant', 'Chicken Kebab'),
      ('meghana-foods', 'Boneless Chicken Biryani'),
      ('meghana-foods', 'Chicken Biryani'),
      ('nagarjuna', 'Chicken Biryani'),
      ('shivaji-military-hotel', 'Mutton Donne Biryani'),
      ('truffles', 'All American Cheeseburger')
    )
);

alter table public.dishes alter column veg set not null;

grant insert (veg) on public.dishes to authenticated;
