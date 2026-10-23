-- Privacy: who can see your "Want to try" list and your Diary: everyone, people who follow you, or only you.
-- Want to try is enforced here (the saves rows themselves). The Diary is a view of your ratings, which stay public
-- on dish pages either way, so the app hides the Diary tab; the setting lives here so it's one place for both.

alter table public.profiles
  add column saves_visibility text not null default 'everyone' check (saves_visibility in ('everyone', 'followers', 'only_me')),
  add column diary_visibility text not null default 'everyone' check (diary_visibility in ('everyone', 'followers', 'only_me'));

grant update (saves_visibility, diary_visibility) on public.profiles to authenticated;

drop policy "saves are public" on public.saves;
create policy "saves follow the owner's privacy" on public.saves for select to anon, authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = saves.user_id
        and (
          p.saves_visibility = 'everyone'
          or (
            p.saves_visibility = 'followers'
            and exists (select 1 from public.follows f where f.followee_id = p.id and f.follower_id = (select auth.uid()))
          )
        )
    )
  );
