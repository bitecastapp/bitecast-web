-- 1. Delete your own account (profile, ratings, photos rows, votes, comments, follows... all cascade from auth.users).
-- 2. Reports: flag a take, a comment or a dish for moderation.

-- Runs as the owner so it may remove the auth user; it can only ever remove the caller.
-- Photo files in Storage aren't rows here: the app deletes the caller's files first.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = (select auth.uid());
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  target_type text not null check (target_type in ('rating', 'comment', 'dish')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'offensive', 'harassment', 'misleading', 'other')),
  note text check (note = btrim(note) and char_length(note) between 1 and 300),
  created_at timestamptz not null default now(),
  -- One report per person per thing; reporting again is a no-op.
  unique (reporter_id, target_type, target_id)
);

create index reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
-- People see only their own reports; reviewing them is for a moderation dashboard later (service side).
grant select on public.reports to authenticated;
grant insert (target_type, target_id, reason, note) on public.reports to authenticated;

create policy "users see their own reports" on public.reports for select to authenticated
  using ((select auth.uid()) = reporter_id);
create policy "users report as themselves" on public.reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);
