# Todo: Auth + onboarding

## Task 1: Scaffold workspace and Next app (M)
Create the pnpm workspace, `apps/web` (Next.js App Router + TS + Tailwind), shadcn init, `@supabase/ssr` client helpers, and `.env.example` with empty `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [x] `pnpm --filter web dev` serves a page at localhost:3000
- [x] `build` and `lint` pass
- [x] `.env.local` is git-ignored; **you fill in your keys**
- Deps: none
- Files: `pnpm-workspace.yaml`, `package.json`, `apps/web/*`, `apps/web/lib/supabase/{client,server,middleware}.ts`

## Task 2: Schema + RLS (S)
`supabase/migrations/20261021142752_auth.sql`: `regions` (seed Bengaluru), `profiles`, RLS policies. You run `supabase login` + `link` once; then `db push`.
- [x] Tables exist in the dev project with RLS enabled
- [x] `supabase/tests/rls.sql` passes: no cross-user update, bad and duplicate usernames rejected
- Deps: none (needs the linked project)
- Files: `supabase/migrations/20261021142752_auth.sql`, `supabase/tests/rls.sql`

### Checkpoint A
- [x] App runs, schema live, RLS checks pass. Review with you.

## Task 3: Login with email link (M)
`/login`: email → magic link → `/auth/callback`. `proxy.ts` sends signed-out users to `/login`. (Code entry dropped: free-tier templates are locked; see spec decision 1.)
- [x] Real email receives a link; tapping it signs you in
- [x] Bad or missing link shows a friendly error
- [x] Signed-out visit to `/` redirects to `/login`
- Deps: 1
- Files: `app/login/page.tsx`, `app/login/actions.ts`, `middleware.ts`, `lib/validation.ts`

## Task 4: Onboarding (M)
`/onboarding`: username + region picker → insert profile. Middleware sends a signed-in user without a profile here.
- [x] Valid submit creates the profile and lands on `/`
- [ ] Invalid or taken username shows an inline error
- [x] Vitest covers the username validator
- Deps: 2, 3
- Files: `app/onboarding/page.tsx`, `app/onboarding/actions.ts`, `middleware.ts`, `lib/validation.ts`, `lib/validation.test.ts`

## Task 5: Home + sign out (S)
`/` shows "hey @username" and a sign-out button.
- [ ] Sign out → `/login`; signing back in skips onboarding
- Deps: 4
- Files: `app/page.tsx`, `app/actions.ts`

### Checkpoint B
- [ ] Full flow works at phone width; `build`, `lint`, `test` pass. Review with you.

## Task 6: Design and a11y pass (M) (design done: see `apps/web/DESIGN.md`)
Visual pass with `impeccable`, copy with `ux-writing`, mobile fixes with `mobile-native`, then `a11y-audit` + `break-ui`.
- [x] No a11y blockers; long and weird input doesn't break layouts
- Deps: 5
- Files: the three pages + `app/globals.css`, `app/layout.tsx`
