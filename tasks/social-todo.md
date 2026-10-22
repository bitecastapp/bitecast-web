# Todo: Social core, slice (a)

- [x] 1. Schema + storage + RLS checks (`supabase/tests/social-rls.sql`)
- [x] 2. Public access (proxy, `getViewer()`); signed-out visitors can read, not write
- [x] 3. Design round: feed card, dish page, rate flow (owner picks)
- [x] 4. Rate flow: score in one tap, optional take + up to 4 photos, update-if-exists
- [x] 5. Dish page: average, 1–10 distribution, reviews Top / New, your rating
- [x] 6. Review page + Facts/Cap (toggle, switch, no self-vote)
- [x] 7. Home feed Top / New
- [ ] 8. Accessibility + break-ui pass; checkpoint with owner

# Todo: Social core, slice (b) comments

- [x] Schema: comments (one reply level enforced by trigger), cached comments_count, RLS + `supabase/tests/comments-rls.sql`
- [x] Comment + reply + delete-own on the take page; count on feed rows
- [x] Worst-case layout at 320px (500-char comment, long handles, Kannada, 6 replies)
- [ ] Real end-to-end check by the owner (needs a signed-in session)
