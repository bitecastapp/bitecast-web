-- Sign-up asks for your name and food preference along with the handle and home region, in the same insert.
-- (Birthday and gender go to profile_private, which already allows insert.)
grant insert (display_name, diet) on public.profiles to authenticated;
