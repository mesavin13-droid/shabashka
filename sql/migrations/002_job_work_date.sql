-- Run once in the dedicated SHABASHKA database before deploying the importer.
-- This nullable field preserves the actual date behind "today / tomorrow".
alter table public.jobs add column if not exists work_date date;
