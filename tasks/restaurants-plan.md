# Implementation Plan: Restaurants + dishes

Spec: [SPEC-restaurants.md](../SPEC-restaurants.md). Checklist: [restaurants-todo.md](restaurants-todo.md).

## Overview
Add `restaurants` and `dishes` (seeded with the approved top 10), then build three screens on top: the restaurant list on home, a restaurant page with its dishes, and a dish page. Last, add the "add a dish" flow with duplicate protection.

## Architecture decisions
- **One migration** holds both tables, RLS, grants and the seed rows, so a fresh project gets everything in one `db push`.
- **Duplicates are caught by the database.** `name_key` is a generated column with a unique index per restaurant. The app mirrors the same normaliser only to show "already on the menu" while typing; the DB is the real gate.
- **Server Components read data** through the existing `getCurrentUser()` session pattern. The add-dish form is a Server Action, like onboarding.
- **The existing dish list is the typeahead source.** A restaurant has a handful of dishes, so the page already has them; no search endpoint needed.
- **Design:** these are new screens inside the Glasshouse world. Before task 3 I'll run the design skill's layout round, so you pick the screen structure from sketches the way you picked the look.

## Order
1. Schema + seed + RLS checks → 2. Dish-name normaliser → **checkpoint A** → (layout round) → 3. Home list + restaurant page → 4. Dish page → 5. Add a dish → **checkpoint B** → 6. Accessibility + break-ui pass

## Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| `db push` needs the database password | Low | If the CLI asks, you run it once in your terminal, like in step 1 |
| App and DB normalisers drift | Medium | A Vitest case table plus the SQL test assert the same pairs |
| Seed data facts (areas, dish names) slightly off | Low | Seed only names and areas; no claims. Fix with a follow-up migration |
| Home stops being a sign-up "done" screen | Low | The glasshouse stays on sign-up screens; the layout round decides how it carries into browsing |
