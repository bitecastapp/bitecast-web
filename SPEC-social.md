# Spec: Ratings, reviews and profiles (the social core)

Approved by the owner on 2026-10-21.

Replaces v1 steps 4 (reviews) and 5 (feed), and adds profiles. Depends on `auth` and `restaurants`. Spaces are parked (branch `spaces-parked`).

## Objective
**Letterboxd + Reddit, for dishes.** Like Letterboxd, every dish has a page with its average score, score spread and reviews, and every person has a profile with stats, favourites and a diary of what they've rated. Like Reddit, reviews get **Agree** (upvote) and **Disagree** (downvote), sort by Top or New, and have comment threads where people argue. Dishes are always tied to a specific restaurant. Tone: Gen-Z, playful, home food is a flex, never region-vs-region.

User stories:
- I open the app and scroll a feed of reviews: dish + place, score, take, photos if any, author, Agree/Disagree and comment counts. I can switch it between **Top** and **New**.
- I tap **Rate**, pick the place and dish (or add the dish), give a score, and optionally add a take and up to 4 photos.
- I Agree or Disagree with a review (tap again to undo; switching is allowed) and sort a dish's reviews by Top or New.
- I comment on a review and reply to a comment.
- A dish page shows the average score, a 1–10 distribution bar, and its reviews.
- A profile shows avatar, name, bio, home, stats (dishes rated, average score, karma), 4 pinned favourite dishes, recent ratings, and reviews. I can edit mine.

## Decisions (assumptions; correct me)
1. **One rating per user per dish** (your original rule). Rating it again updates your entry instead of adding a second.
2. **A rating needs only the score (1–10).** The take (≤500 characters) and photos (0–4) are optional, like Letterboxd. A rating with a take is a "review" and shows in feeds; a bare score counts toward the dish average and the user's diary.
3. **Agree / Disagree = up/down votes on reviews:** one vote per user per review, switchable, no voting on your own review. Shown as a net score with the split on tap. **Karma** = net votes across a user's reviews.
4. **Sorting:** Top = net votes (time-windowed later, like Reddit's "top this week"); New = newest. The home feed defaults to Top.
5. **Comments:** threaded one level deep (comment → replies), plain text ≤500 characters. No votes on comments in v1. Delete your own; reports come in step 7.
6. **Profiles:** `/u/<handle>`, 4 pinned favourite dishes (optional), stats, recent ratings (diary), reviews.
7. **Photos:** Supabase Storage, resized in the browser (max 1600px, WebP); users write only under their own folder.
8. **A dish's score** is the plain average with a count ("8.4 from 12 ratings") plus a 1–10 distribution. The weighted rule (new accounts count less) applies when we add rankings or leaderboards.
9. **Communities** (Reddit-style, e.g. b/biryani) are the future home of the parked Spaces idea, not v1.

## Screens
| Route | What |
|---|---|
| `/` | Feed of reviews (Top / New), search, a floating **Rate** button. |
| `/rate` | Pick place → dish (or add one) → score → optional take and photos. |
| `/review/[id]` | A review with its comment thread (shareable). |
| `/r/[slug]/[dish]` | Dish page: average, distribution, reviews (Top / New), your rating. |
| `/r/[slug]` | Restaurant: its dishes with averages. |
| `/u/[handle]` | Profile: stats, favourites, diary, reviews. |
| `/settings/profile` | Edit avatar, name, bio, favourites. |

## Data (sketch, finalised in the plan)
- **`ratings`:** id, user, dish, score (1–10), take (≤500, nullable), created/updated; unique (user, dish).
- **`rating_photos`:** rating, storage path, position (1–4).
- **`votes`:** rating, user, kind (`facts` | `cap`); unique (rating, user).
- **`comments`:** id, rating, user, parent (nullable, one level), body (≤500), created.
- **`favourites`:** user, dish, position (1–4).
- **`profiles` gains:** `display_name`, `bio` (≤160), `avatar_path`.
- **Storage buckets:** `rating-photos` and `avatars`.
- **Counts** (votes, comments, averages, karma): views first, cached columns if needed.

## Design
This is the biggest change to how the app feels. A scroll-first social feed with photos is a different screen type from the calm forms built so far, and you asked for **more Gen-Z**. Before building the feed I'll run a design round for the feed card and profile, like we did for the look, with sketches you pick from. The Glasshouse look can stay as the base or be pushed louder. That's your call in that round.

## Out of scope (later)
Following and a friends feed, communities (ex-Spaces), notifications, votes on comments, lists, rankings and leaderboards, Tastes like home, reporting (step 7), video.

## Success criteria
- [ ] Rating a dish takes under 10 seconds; a full review with photos under a minute, on a phone.
- [ ] The feed shows reviews sorted Top or New and scrolls smoothly with photos.
- [ ] Agree/Disagree toggles and switches, and blocks self-votes, enforced by the database.
- [ ] Comments and one level of replies work; you can delete your own.
- [ ] Dish pages show average, distribution and reviews; profiles show stats, favourites, diary and reviews.
- [ ] RLS: nobody can edit someone else's ratings, photos, comments, votes or profile.

## Resolved questions
1. Following: not in v1. One shared Top / New feed; follow + Friends tab right after.
2. Public: dish pages, reviews, profiles and the feed are readable by anyone; rating, voting and commenting need sign-in.
3. Build in 3 slices: (a) rate + dish page + review page + Agree/Disagree + feed (with the design round first), (b) comments, (c) profiles + favourites.
