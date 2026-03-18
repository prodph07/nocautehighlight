-- Migration to add `is_editor` column to `profiles` table
alter table public.profiles add column if not exists is_editor boolean default false;
