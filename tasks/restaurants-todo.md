# Todo: Restaurants + dishes

## Task 1: Schema, seed and RLS checks (S)
Migration with `restaurants` and `dishes` (generated `name_key`, unique per restaurant), RLS, grants, and the 10 restaurants plus their seed dishes.
- [x] `db push` applies cleanly; 10 restaurants and their dishes exist
- [x] `supabase/tests/restaurants-rls.sql` passes: no inserting as someone else, no update or delete, duplicates refused at the same restaurant, same name allowed at another
- [x] Supabase advisors report no issues
- Deps: none
- Files: `supabase/migrations/*_restaurants.sql`, `supabase/tests/restaurants-rls.sql`

## Task 2: Dish-name normaliser (XS)
`dishKey(name)` in the app, mirroring the DB's `name_key`.
- [x] Vitest table covers spacing, casing, punctuation and unicode cases, with the same pairs asserted in the SQL test
- Deps: 1
- Files: `apps/web/lib/dishes.ts`, `apps/web/lib/dishes.test.ts`

### Checkpoint A
- [x] Data live, tests pass. Then the layout round for the new screens.

## Task 3: Home list + restaurant page (M)
Home shows the 10 restaurants; `/r/[slug]` shows name, area and dishes. Unknown slug → 404.
- [x] Home → restaurant works at phone width; dish rows link to `/d/[id]`
- [x] Empty dish list has a friendly empty state
- Deps: 1, layout round
- Files: `app/page.tsx`, `app/home-view.tsx`, `app/r/[slug]/page.tsx`, `lib/restaurants.ts`

## Task 4: Dish page (S)
`/d/[id]`: dish name, restaurant (linked back), "ratings open soon". Unknown id → 404.
- [x] Restaurant → dish → back works
- Deps: 3
- Files: `app/d/[id]/page.tsx`

## Task 5: Add a dish (M)
On the restaurant page: a field that filters existing dishes as you type, then a Server Action to insert. A duplicate shows "already on the menu" with a link.
- [ ] New dish appears in the list and links to its page
- [x] Duplicates (any casing or spacing) are refused, inline and by the DB
- [x] Too short or too long names are refused with a clear message
- Deps: 2, 3
- Files: `app/r/[slug]/add-dish.tsx`, `app/r/[slug]/actions.ts`

### Checkpoint B
- [ ] Full browse + add flow works at phone width; `build`, `lint`, `test` pass. Review with you.

## Task 6: Accessibility + break-ui pass (S)
Same checks as step 1, with worst-case fixtures added to `/dev/break-ui` (long restaurant and dish names, 0 dishes, 50 dishes).
- [x] No a11y failures; no layout breaks
- Deps: 5
- Files: the new screens, `app/dev/break-ui/*`
