-- Run schema.sql first. Create the account through Authentication > Users.
-- Administrator requested for this project: admin@example.com.
-- Run only in the trusted Supabase SQL Editor, never from the website.
do $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users where lower(email) = lower('admin@example.com');
  if admin_id is null then
    raise exception 'Create admin@example.com in Authentication > Users before running this script.';
  end if;
  insert into public.admin_users (user_id) values (admin_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Confirm that the expected account was granted access:
select u.id, u.email from auth.users u
join public.admin_users a on a.user_id = u.id;

-- To revoke one administrator later, replace the email and run separately:
-- delete from public.admin_users where user_id in
-- (select id from auth.users where lower(email) = lower('admin@example.com'));
