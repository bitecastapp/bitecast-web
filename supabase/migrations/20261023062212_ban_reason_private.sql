-- profiles is public, so a ban reason there would be readable by anyone. Keep the reason only in the admin-only
-- moderation log (admin_set_ban already writes it there).
create or replace function public.admin_set_ban(account uuid, banned boolean, reason text default null, purge boolean default false) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := private.require_admin();
  paths text[];
begin
  if account = me or exists (select 1 from public.admins where user_id = account) then
    raise exception 'admins can''t be banned' using errcode = '42501';
  end if;
  update public.profiles set banned_at = case when banned then now() end where id = account;
  if banned and purge then
    select array_agg(p.path) into paths from public.rating_photos p join public.ratings r on r.id = p.rating_id where r.user_id = account;
    delete from public.ratings where user_id = account;
    delete from public.comments where user_id = account;
  end if;
  insert into public.moderation_log (admin_id, action, target_type, target_id, detail)
    values (me, case when banned then 'ban' else 'unban' end, 'account', account, jsonb_build_object('reason', nullif(btrim(reason), ''), 'purge', purge));
  return coalesce(paths, '{}');
end $$;

alter table public.profiles drop column ban_reason;
