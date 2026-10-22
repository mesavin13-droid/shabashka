-- Add a moderator-controlled priority flag to existing job listings.
alter table public.jobs add column if not exists is_urgent boolean not null default false;
