# Spec: Restaurants + dishes (v1 step 2)

Module `restaurants`, depends on `auth` (signed-in users). Approved by the owner on 2026-10-21 with the changes below. Spaces (step 3) and reviews (step 4) build on the dishes made here.

## Objective
A signed-in user can browse a short list of well-known restaurants, open one, and see its dishes. Dishes are the thing people will rate in step 4, so each dish needs a stable page now. For launch the list is **10 seeded restaurants**; nobody can add restaurants yet.

User stories:
- From home, I see the 10 restaurants and can open one.
- On a restaurant, I see its dishes and can open a dish.
- If a dish I want to rate is missing, I can add it to that restaurant, and I'm stopped if it's already there under the same name.

## Decisions (assumptions; correct me)
1. **Restaurants are seed-only for now.** No "add a restaurant" flow, so no restaurant duplicate handling yet. That arrives with user-added restaurants later.
2. **Dishes: seeded and user-added.** Each seeded restaurant gets its 3–5 best-known dishes. Signed-in users can add a dish to a restaurant, so people aren't blocked when a dish is missing.
3. **Dish duplicates:** names are compared after lowercasing, trimming, and collapsing spaces and punctuation ("Masala  Dosa" = "masala dosa" = "Masala-Dosa"), unique per restaurant and enforced by the database. The add form shows matching existing dishes as you type.
4. **A dish belongs to its restaurant only, with no region field** (owner's call). Consequence: Tastes like home can't match on dishes. Proposed fix for step 3: a Space (e.g. Hyderabadi Biryani) carries the origin and its dishes inherit it. To be decided in the Spaces spec.
5. **Restaurant fields:** name, URL slug, area/neighbourhood, city. City is a column from day one because Bitecast is pan-India, even though every seed row is Bengaluru. No address, photos, ratings, hours or prices.
6. **Visibility:** restaurants and dishes are readable by signed-in users only, the same as profiles. Public pages for sharing come later.
7. **Nobody edits or deletes dishes from the app.** Fixes go through the database for now; reporting and moderation come in step 7.

## Proposed top 10 (Bengaluru)
Picked for being famous for specific dishes, which fits "rate the dish". Seed data only; swap freely.

| Restaurant | Area | Seed dishes |
|---|---|---|
| Vidyarthi Bhavan | Basavanagudi | Masala Dosa, Rava Vada, Kesari Bath |
| Mavalli Tiffin Room (MTR) | Lalbagh Road | Rava Idli, Bisi Bele Bath, Masala Dosa |
| CTR (Central Tiffin Room) | Malleshwaram | Benne Masala Dosa, Mangalore Bajji |
| Brahmin's Coffee Bar | Basavanagudi | Idli, Vada, Kesari Bath, Filter Coffee |
| The Rameshwaram Cafe | Indiranagar | Ghee Podi Idli, Ghee Masala Dosa |
| Meghana Foods | Koramangala | Chicken Biryani, Boneless Chicken Biryani |
| Nagarjuna | Residency Road | Andhra Meals, Chicken Biryani |
| Shivaji Military Hotel | Jayanagar | Mutton Donne Biryani |
| Empire Restaurant | Church Street | Ghee Rice, Chicken Kebab |
| Truffles | Koramangala | All American Cheeseburger |

## Data model (one new migration)
```sql
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 80),
  area text not null check (char_length(area) between 1 and 60),
  city text not null default 'Bengaluru',
  created_at timestamptz not null default now()
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  name_key text generated always as (
    btrim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g'))
  ) stored,
  created_by uuid references auth.users on delete set null,  -- null = seeded
  created_at timestamptz not null default now(),
  unique (restaurant_id, name_key)
);
create index on public.dishes (restaurant_id);
```
RLS and grants: `restaurants` select for `authenticated`. `dishes` select for `authenticated`; insert only with `created_by = auth.uid()`, column grants limited to `(restaurant_id, name, created_by)`; no update or delete.

## Screens
| Route | What |
|---|---|
| `/` (home) | Dish-first (owner, 2026-10-21): "What are you craving?", search, a **Dishes** tab (same-name dishes grouped with "At N places") and a **Places** tab (restaurants by neighbourhood). |
| `/r/[slug]` | Restaurant: name, area, dish list, and an "Add a dish" sheet. |
| `/r/[slug]/[dish]` | Dish: name and restaurant. `[dish]` is the dish's `name_key` with spaces as hyphens (unique per restaurant, reversible), e.g. `/r/vidyarthi-bhavan/masala-dosa`. The rating UI lands here in step 4; until then, a quiet "ratings open soon" note. |

These are new surfaces in the established Glasshouse design. I'll run the design skill's layout round when building, not in this spec.

## Testing
- Vitest: the dish-name normaliser in the app matches the DB's `name_key` for tricky names ("Benne  Masala-Dosa", "Ghee Podi Idli!").
- SQL in `supabase/tests/`: users can't insert a dish as someone else, can't update or delete dishes, can't add a duplicate name to the same restaurant, and can add the same name at a different restaurant.
- Manual: home → restaurant → dish → add a dish (including a duplicate) at phone width.

## Boundaries
- **Always:** RLS on both tables, explicit grants, validation in the DB.
- **Ask first:** user-added restaurants, photos, maps or location data, any extra dependency.
- **Never:** invented ratings, review counts or "popular" claims on seed data.

## Success criteria
- [ ] 10 restaurants and their seed dishes are in the dev project.
- [ ] Home → restaurant → dish works on a phone.
- [ ] Adding a new dish works; adding a duplicate (any casing or spacing) is refused with a link to the existing dish.
- [ ] RLS checks pass; `build`, `lint`, `test` pass.

## Later: restaurant URLs
Restaurant URLs are plain slugs (`/r/vidyarthi-bhavan`) while the 10 seeded restaurants are the only ones. When **user-added restaurants** arrive, switch to **id + slug** (e.g. `/r/7k3p9/truffles-koramangala`): the short id resolves the restaurant, so chains with the same name across areas and cities don't collide and renames don't break links; a stale or wrong slug part redirects to the current one. Dish URLs then become `/r/<id>/<slug>/<dish>`. (Owner, 2026-10-21.)

## Resolved questions
1. Top 10: approved as listed.
2. Dish origins: none. Dishes belong to restaurants only (see decision 4).
3. User-added dishes: yes, from this step.

## Open questions
- None for this step. Tastes like home's source of origin moves to the Spaces spec.
