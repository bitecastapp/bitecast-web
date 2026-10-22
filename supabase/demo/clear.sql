-- Removes ALL demo data (demo accounts and, by cascade, their ratings, photos rows, votes and comments).
-- Run before launch: pnpm dlx supabase db query --linked -f supabase/demo/clear.sql
-- Then delete the demo photo files, which SQL can't remove:
--   pnpm dlx supabase storage rm -r ss:///rating-photos/00000000-0000-0000-0000-0000000000de --linked --experimental
delete from auth.users where email like '%@demo.bitecast.test';
select count(*) as demo_users_left from public.profiles where username like 'demo\_%';
