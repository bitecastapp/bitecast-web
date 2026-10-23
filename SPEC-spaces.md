# Spec: Spaces (v1 step 3) — PARKED

> **Superseded on 2026-10-23 by `SPEC-rankings.md`:** the lists are now fixed and set by us; nobody creates Spaces or assigns dishes from the app.

> **Parked on 2026-10-21** by the owner ("completely confusing, let us think about this later"). The UI lives on branch `spaces-parked`. The database migration stays applied on `main` (tables unused) so migration history matches the live project.

Module `spaces`, depends on `restaurants` (dishes). Approved by the owner on 2026-10-21. Reviews (step 4) fill the leaderboards; Tastes like home (step 6) may hang off Spaces.

## Objective
A **Space** is one food, like Biryani, Dosa or Filter Coffee. It collects that food's dishes from every restaurant into one leaderboard. Anyone signed in can create a Space and put dishes in it. Until ratings exist (step 4), a Space is the list of contenders; ranking switches on when reviews ship.

User stories:
- From home I see Spaces like Dosa and Biryani, and tap one to see every dosa across places.
- I can put a dish that isn't in any Space into one.
- I can create a Space for a food that's missing, and I'm stopped if it already exists under the same name.
- On a dish page I can see which Space it competes in.

## Decisions (assumptions; correct me)
1. **A dish is in at most one Space.** Benne Masala Dosa competes in Dosa, not also in "Breakfast". One home per dish keeps leaderboards clean and makes gaming harder. Spaces are foods, not occasions or moods.
2. **Assigning a dish:** anyone signed in can put an unassigned dish into a Space, including while adding a new dish. Once a dish is in a Space, the app can't move it; a wrong placement gets reported (step 7) and fixed in the database.
3. **Duplicate Spaces** are caught the same way as dishes: names compare after lowercasing and stripping spaces and punctuation, globally unique. The create form shows similar existing Spaces as you type. Spelling variants ("Biriyani") aren't caught automatically; reports handle those.
4. **Spaces are national, not per city.** The Biryani leaderboard covers everywhere. A city filter comes once there's more than one city.
5. **URL:** `/s/<slug>`, e.g. `/s/masala-dosa`, built from the name with the same rule as dish URLs.
6. **No ranking yet.** A Space lists its dishes alphabetically and says "Ranking starts when ratings open". The Bayesian leaderboard is step 4's job.
7. **Nobody edits or deletes Spaces from the app.** Same as dishes.

## Seed Spaces
Mapped from the 22 seeded dishes, so Spaces aren't empty on day one:

| Space | Seed dishes |
|---|---|
| Dosa | Masala Dosa ×2, Benne Masala Dosa, Ghee Masala Dosa |
| Idli | Idli, Rava Idli, Ghee Podi Idli |
| Vada | Vada, Rava Vada |
| Biryani | Chicken Biryani ×2, Boneless Chicken Biryani, Mutton Donne Biryani |
| Kesari Bath | Kesari Bath ×2 |
| Bisi Bele Bath | Bisi Bele Bath |
| Filter Coffee | Filter Coffee |
| Meals | Andhra Meals |
| Burger | All American Cheeseburger |
| Kebab | Chicken Kebab |
| Bajji | Mangalore Bajji |
| Ghee Rice | Ghee Rice |

## Data model (one new migration)
```sql
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name = btrim(name) and char_length(name) between 2 and 40),
  name_key text generated always as (<same expression as dishes.name_key>) stored
    unique check (name_key <> ''),
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);
alter table public.dishes add column space_id uuid references public.spaces on delete set null;
create index on public.dishes (space_id);
```
RLS and grants:
- `spaces`: select and insert for signed-in users (insert as themselves; name only).
- `dishes.space_id`: an update is allowed only while `space_id` is null, and only that column (a column grant plus a policy `using (space_id is null)`).
- No deletes.

## Screens
| Route | What |
|---|---|
| `/` (home) | A row of Space chips under the search box (most dishes first, plus "+ New Space"); search also matches Spaces. |
| `/s/[slug]` | Space: name, dish count, its dishes (dish name, then place and area) linking to dish pages, "Ranking starts when ratings open", and "Add a dish to this Space" (search across unassigned dishes). |
| `/s/new` | Create a Space: name field with live "already exists" and similar-name hints; lands on the new Space. |
| Dish page | Shows "Competes in **Dosa**", or "Not in a Space yet" with a picker if unassigned. |
| Restaurant → Add a dish | Optional "Which Space?" picker. |

## Testing
- Vitest: Space name validation; `dishKey` reuse covers the key.
- SQL in `supabase/tests/spaces-rls.sql`:
  - duplicate Space names are refused
  - a dish can be assigned once and never reassigned
  - users can't touch other `dishes` columns, and can't update or delete Spaces
- Manual at phone width: home chips → Space → dish; create a Space (including a duplicate); assign a dish from the dish page and from the Space page.

## Boundaries
- **Always:** RLS, column-level grants, DB-enforced uniqueness.
- **Ask first:** dishes in several Spaces, per-city leaderboards, Space images or icons.
- **Never:** fake rankings or "trending" claims before ratings exist.

## Success criteria
- [ ] 12 seed Spaces live with their dishes.
- [ ] Home → Space → dish works on a phone; Space chips and search find Spaces.
- [ ] Creating a Space works; duplicates are refused with a link to the existing one.
- [ ] Assigning works once; reassigning is impossible (UI and DB).
- [ ] RLS checks pass; `build`, `lint`, `test` pass.

## Resolved questions
1. One Space per dish: yes.
2. Tastes like home: a Space may carry an origin region, added in step 6 (not now).
3. The 12 seed Spaces: approved.
