-- The pre-launch waitlist: emails of people who want in. Anyone can add an email; nobody can read the list through
-- the app (view it in the Supabase dashboard). One row per email.
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(btrim(email)) and char_length(email) between 3 and 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;
grant insert (email) on public.waitlist to anon, authenticated;

create policy "anyone can join the waitlist" on public.waitlist for insert to anon, authenticated with check (true);
