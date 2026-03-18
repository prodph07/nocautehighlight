-- Migration: Add editor assignment columns to order_items
alter table public.order_items add column if not exists editor_id uuid references auth.users(id);
alter table public.order_items add column if not exists editor_name text;
