# Spec: Auth + onboarding (v1 step 1)

Module map = the ordered v1 list in `CLAUDE.md`. This is module `auth`; everything else depends on it.

## Objective
A new visitor can sign up with email, choose a username and a **home region**, and land in the app signed in. A returning user signs in and skips onboarding. Every later feature reads `profiles.username` and `profiles.home_region`.

User stories:
- As a new user I enter my email, tap the link in the email, and I'm in.
- Before I can use the app I must pick a unique username and my home region.
- As a returning user, signing in takes me straight to the home screen.
- I can sign out.

## Decisions (assumptions; correct me)
1. **Email magic link, no passwords.** `signInWithOtp({ email, options: { emailRedirectTo } })`, then `/auth/callback` exchanges the code for a session. *Changed from a 6-digit code:* since 2026-06-03, new free Supabase projects can't edit auth email templates without custom SMTP, and the default template only has a link. Switch to a code once custom SMTP (e.g. Resend) is set up. Limit: the link must be opened in the same browser that requested it.
2. **Same flow for sign-up and sign-in.** Supabase creates the user on first OTP.
3. **Regions are a seeded table**, not free text, so "Tastes like home" can match exactly. Each row has a `demonym` for copy like "8.7 from 12 Hyderabadis".
4. **Regions: seed only Bengaluru for now.** More regions are added later by a migration (insert rows, no code change). Until then the picker shows one option and Tastes like home only applies to dishes whose origin is Bengaluru.
5. **Username:** 3–20 chars, `a-z 0-9 _`, stored lowercase, unique. Validated in the DB (check constraint + unique index), and in the UI for quick feedback.
6. **Onboarding gate:** `proxy.ts` (Next 16's renamed middleware) sends signed-out users to `/login`; pages call `getCurrentUser()` and send a signed-in user with no `profiles` row to `/onboarding`. The profile row is created by the onboarding form (not a trigger), so "has profile" == "finished onboarding".
7. **No home-region change rule yet.** With one region there's nothing to change to. Add a rate limit (e.g. once per 30 days, DB trigger) in the migration that adds more regions.

## Data model (migration `0001_auth.sql`)
```sql
create table public.regions (
  slug text primary key,          -- 'hyderabad'
  name text not null,             -- 'Hyderabad'
  demonym text not null           -- 'Hyderabadis'
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  home_region text not null references public.regions(slug),
  created_at timestamptz not null default now()
);
```
RLS:
- `regions`: select for everyone; no writes from clients.
- New tables aren't exposed to the Data API by default anymore, so the migration grants exactly the needed privileges (column-level for insert/update).
- `profiles`: select for signed-in users only (open to `anon` later if public profile pages need it); insert/update only where `id = auth.uid()`; no delete (account deletion cascades from `auth.users`).

## Screens
| Route | Who | What |
|---|---|---|
| `/login` | signed out | email field → "check your inbox" |
| `/auth/callback` | link click | exchanges code, redirects to `/` |
| `/onboarding` | signed in, no profile | username + home region picker |
| `/` | signed in with profile | placeholder home ("hey @username") + sign out |

Copy is playful and short (`ux-writing`); visuals via `impeccable`. Region picker is a list, never framed as region-vs-region.

## Tech stack
Next.js (App Router, latest stable) + TypeScript + Tailwind + shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, `zod` for form validation. Supabase CLI via `pnpm dlx supabase` for migrations (linked to the cloud dev project). Vitest for unit tests.

## Commands
```
pnpm install
pnpm --filter web dev            # http://localhost:3000
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test           # vitest run
pnpm dlx supabase db push        # apply migrations to the dev project
```

## Project structure
```
pnpm-workspace.yaml
apps/web/
  app/login/        page, client screen, server action
  app/auth/callback/route.ts
  app/onboarding/   page, client form, server action
  app/page.tsx      home + sign out
  lib/supabase/{server,proxy}.ts               # standard @supabase/ssr setup
  lib/auth.ts                                  # getCurrentUser(): the one session read
  lib/validation.ts (+ .test.ts)               # zod: email, username
  components/{plate,screen}.tsx                # scoreboard design system
  components/ui/                               # shadcn
  proxy.ts
  DESIGN.md, PRODUCT.md                        # design system + product context
supabase/migrations/*_auth.sql
supabase/tests/                                # SQL checks for RLS
```

## Code style
Server Components by default; forms use Server Actions. No client-side permission checks; RLS is the only gate.
```ts
export const username = z.string().trim().toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "3–20 letters, numbers or _");
```

## Testing strategy
- Vitest: zod validators (username edge cases).
- SQL script in `supabase/tests/` run against the dev project: user A can't update user B's profile, bad usernames are rejected, duplicate usernames are rejected.
- Manual: full sign-up → onboarding → sign-out → sign-in on a phone-width browser.

## Boundaries
- **Always:** RLS on every table; publishable key only on the client; validate at the DB.
- **Ask first:** new dependencies beyond the list above; schema changes after `0001` ships; enabling Google/phone auth.
- **Never:** service-role key in `apps/web`; committing `.env.local`; client-only auth checks.

## Success criteria
- [ ] New email → link → onboarding → home, in under a minute on a phone.
- [ ] Returning user skips onboarding.
- [ ] Signed-out visit to `/` or `/onboarding` redirects to `/login`; signed-in user without a profile is always redirected to `/onboarding`.
- [ ] Duplicate or invalid username shows a friendly inline error (the DB rejects it too).
- [ ] All RLS checks in `supabase/tests/` pass.
- [ ] `build`, `lint`, `test` all pass.

## Open questions
1. Custom SMTP (Resend or similar) before launch: lifts the email rate limit and unlocks a 6-digit code instead of a link.
2. Reserved handles (`admin`, `nomrank`...): not blocked yet.
