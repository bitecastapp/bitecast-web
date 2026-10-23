# Spec: Rankings and Tastes like home (v1 steps 3 and 6)

Owner decisions, 2026-10-23. Supersedes the parked `SPEC-spaces.md` (user-made Spaces stay parked).

## What it is
- **Rankings:** one leaderboard per food (Dosa, Biryani, Idli…). The food lists are fixed and set by us in the database (the existing `spaces` table); people browse them, they never create lists or assign dishes.
- **Tastes like home:** on a dish, the average score from people whose home region is that food's home region, e.g. "8.7 from 12 Hyderabadis".

## Rules
1. **Which list a dish is in:** set by a database trigger when the dish is added: the list whose name appears in the dish name, longest match first ("Benne Masala Dosa" → Dosa, "Cheeseburger" → Burger). No match → in no list until we add one. Users can't change it.
2. **Rank:** a Bayesian (weighted) average: `(C·m + Σ w·score) / (C + Σ w)` with `C = 5` and a fixed prior `m = 7` (a list's own average swings too much while ratings are few). One 10/10 scores 7.5, four 9s score 7.9.
3. **New accounts weigh less:** a rating from an account younger than 7 days counts half (`w = 0.5`, else 1).
4. **Unrated dishes** sit below the ranked ones, unnumbered, as "Not rated yet".
5. **Tastes like home** comes from the dish's list: each list may carry an `origin_region`. Shown only with 3 or more ratings from that region, with the count. Lists without an origin, and dishes in no list, never show it. Copy celebrates home food, never region vs region.
6. **Regions:** about 10 (Karnataka, Hyderabad, Tamil Nadu, Kerala, Andhra, Mumbai, Delhi, Kolkata, Punjab, Gujarat). Bengaluru becomes Karnataka. Your home region can change once every 30 days (database trigger), from Edit profile.
7. The diet preference filters ranking lists like other dish lists; rank numbers stay the real ones.

## Origins (first pass, change by migration)
Dosa, Kesari Bath, Bisi Bele Bath, Bajji → Karnataka · Idli, Vada, Filter Coffee → Tamil Nadu · Biryani → Hyderabad · Ghee Rice → Kerala · Meals, Burger, Kebab → none.

## Screens
| Where | What |
|---|---|
| Home | A **Rankings** tab: each food with its current #1 and dish count. |
| `/top/[food]` | The leaderboard: rank, dish, place, overall score, Tastes like home where shown; then "Not rated yet". |
| Dish page | "#2 in Dosa" (links to the list) and the Tastes like home line. |
| Edit profile | Home region picker (once every 30 days). |

## Data
- `regions`: new rows; `profiles.home_region_changed_at` (trigger-maintained).
- `spaces.origin_region` → `regions`. Spaces become readable by everyone; user insert and dish assignment are revoked.
- View `dish_rankings` (security invoker): `dish_id, space_id, ratings, rank_score, rank, home_avg, home_count` (`home_avg` null under 3).

## Tests
SQL: ranking order and weighting, the 3-rating threshold, auto-assignment, users can't create lists or assign dishes, the 30-day region rule. Vitest: the region-change error message mapping where added.

## Out of scope
User-created lists, moving a dish between lists, per-city lists, Battles.
