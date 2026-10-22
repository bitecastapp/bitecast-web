# Implementation Plan: Social core (Letterboxd + Reddit for dishes)

Spec: [SPEC-social.md](../SPEC-social.md). Checklist: [social-todo.md](social-todo.md).

## Slices
- **(a) Rate + Facts/Cap + feed:** ratings, photos, votes; the rate flow, dish page, review page, home feed (Top / New); public read.
- **(b) Comments:** threaded one level on review pages.
- **(c) Profiles + favourites:** profile page, edit profile, avatar, 4 favourites, diary, karma.

## Architecture decisions
- **Ratings reference `profiles`, not `auth.users`,** so the API can embed the author's handle in one query.
- **Vote counts are cached on `ratings`** (`facts_count`, `cap_count`), kept current by a trigger in a private schema. Who voted stays private (RLS shows you only your own votes); counts stay public without a security-definer view.
- **Public read:** `anon` gets select on restaurants, dishes, ratings, photos and profiles; `proxy.ts` stops redirecting signed-out visitors away from public pages. Writing always needs a session, and pages read the viewer with a non-redirecting `getViewer()`.
- **Photos:** a public-read Storage bucket `rating-photos`; uploads only under `<user id>/`; resized to ≤1600px WebP in the browser before upload.
- **Dish averages and distribution** are computed from that dish's ratings on the page (shortcut: fine at this scale; move to cached columns once dishes have hundreds of ratings).
- **Design round** for the feed card, dish page and rate flow before UI tasks, since this is a new kind of screen and needs the Gen-Z push.

## Order (slice a)
1. Schema: ratings, photos, votes, counters, public read, storage + RLS checks
2. Public access: proxy + `getViewer()`
3. **Design round** (you pick)
4. Rate flow (`/rate`, and "Rate this" from dish pages)
5. Dish page: average, distribution, reviews Top/New, your rating
6. Review page + Facts/Cap
7. Home feed (Top / New)
8. Accessibility + break-ui pass → **checkpoint with you**

## Risks
| Risk | Mitigation |
|---|---|
| Photo upload on slow mobile data | Resize before upload; show progress; post works without photos |
| Vote counter drift | Trigger is the only writer; SQL test checks counts after insert, switch and delete |
| Public read leaking private data | Only explicit columns granted to `anon`; profiles hold no email; RLS test as `anon` |
| Spam ratings or reviews | One per user per dish (DB); reports in step 7 |
