-- A banned account can't edit its public profile either (name, bio, photo, Instagram), so a ban can't be used to
-- turn the profile into a billboard. Admins banning or unbanning still works: the check is on who makes the change.
create trigger profiles_block_banned before update on public.profiles
  for each row execute function private.block_banned();
