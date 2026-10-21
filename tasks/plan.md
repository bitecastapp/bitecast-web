# Implementation Plan: Auth + onboarding

Spec: [SPEC-auth.md](../SPEC-auth.md). Task checklist: [todo.md](todo.md).

## Overview
Set up the pnpm workspace and Next.js app, add the `regions` + `profiles` schema with RLS, then build login (email code) → onboarding (username + home region) → home, each as a working slice.

## Architecture decisions
- `@supabase/ssr` with the standard three helpers (browser client, server client, middleware session refresh). No custom auth wrapper.
- One `middleware.ts` does all routing gates: signed out → `/login`; signed in without a profile → `/onboarding`.
- Forms are Server Actions; zod validates input on the server, and the DB constraints are the final word.
- Migrations live in `supabase/migrations` and are pushed with `pnpm dlx supabase db push`. No local Docker Supabase.

## Order
1. Scaffold → 2. Schema → **checkpoint** → 3. Login → 4. Onboarding → 5. Home + sign out → **checkpoint** → 6. Design and a11y pass → **done**

All tasks run in sequence: each builds on the one before it.

## Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Supabase's default email sends a **magic link, not a code** | High (login breaks) | You edit the "Magic Link" email template in the dashboard to include `{{ .Token }}` (task 3) |
| Built-in email allows only a few sends per hour | Medium (dev slowdown) | Fine for dev; custom SMTP (e.g. Resend) before launch |
| `supabase link` needs an interactive login and the DB password | Low | You run `supabase login` + `link` once in your terminal (task 2) |
| Next.js renaming `middleware.ts` → `proxy.ts` in newer versions | Low | Use whatever the installed version's docs say |
