create table public.login_challenges (
 id uuid primary key, secret_hash text not null, code text not null,
 telegram_id text, telegram_name text, approved_at timestamptz,
 expires_at timestamptz not null, consumed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.login_challenges enable row level security;
revoke all on public.login_challenges from public,anon,authenticated;
create index login_challenges_expiry_idx on public.login_challenges(expires_at);
create or replace function public.shabashka_consume_login(challenge_id uuid,poll_hash text)
returns table(telegram_id text,telegram_name text) language sql security definer set search_path=public as $$
 update public.login_challenges set consumed_at=now()
 where id=challenge_id and secret_hash=poll_hash and approved_at is not null
 and expires_at>now() and consumed_at is null
 returning login_challenges.telegram_id,login_challenges.telegram_name;
$$;
revoke all on function public.shabashka_consume_login(uuid,text) from public,anon,authenticated;
grant execute on function public.shabashka_consume_login(uuid,text) to service_role;
