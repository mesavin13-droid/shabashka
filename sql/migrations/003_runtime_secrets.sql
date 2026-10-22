create extension if not exists supabase_vault with schema vault;
create extension if not exists pg_net with schema extensions;
create or replace function public.shabashka_runtime_config()
returns jsonb
language sql stable security definer set search_path = ''
as $$
 select coalesce(jsonb_object_agg(name,decrypted_secret),'{}'::jsonb)
 from vault.decrypted_secrets
 where name in ('shabashka_bot_token','shabashka_webhook_secret','shabashka_site_url');
$$;
revoke all on function public.shabashka_runtime_config() from public, anon, authenticated;
grant execute on function public.shabashka_runtime_config() to service_role;
