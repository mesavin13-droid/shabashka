-- Run only in a newly designated database. Review data localization requirements first.
create extension if not exists pgcrypto;
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('vacancy','candidate')),
  status text not null default 'pending' check (status in ('pending','published','rejected','archived')),
  title text not null,
  category text not null default 'Другое',
  summary text,
  raw_text text,
  district text,
  city text not null default 'Новосибирск',
  pay_amount integer check (pay_amount >= 0),
  pay_unit text,
  schedule text,
  work_date date,
  workers_needed integer not null default 1 check (workers_needed between 0 and 99),
  payment_terms text,
  sent_at timestamptz,
  source_name text,
  source_username text,
  source_url text,
  source_key text unique,
  source_allowed boolean not null default false,
  content_hash char(64) unique,
  review_flags text[] not null default '{}',
  imported_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_public_feed_idx on public.jobs(status, created_at desc);
create index if not exists jobs_type_category_idx on public.jobs(type, category);
-- We intentionally expose NO table permissions to anon or authenticated.
-- All database access is via server-side admin key + strict API endpoints.
alter table public.jobs enable row level security;
revoke all on public.jobs from anon, authenticated;
-- service_role bypasses RLS only on the trusted server; never distribute that key.
