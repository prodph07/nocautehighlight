-- Migration: Add RLS policies for editors and admins

-- Drop the previous policies that caused infinite recursion
DROP POLICY IF EXISTS "Editors and admins can select all orders" ON public.orders;
DROP POLICY IF EXISTS "Editors and admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Editors and admins can select all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Editors and admins can update all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Editors and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Editors and admins can view all events" ON public.events;

-- Create a security definer function to avoid infinite recursion when checking roles
create or replace function public.is_admin_or_editor()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin = true or is_editor = true)
  );
end;
$$;

-- Policies for orders
create policy "Editors and admins can select all orders" on public.orders
  for select using ( public.is_admin_or_editor() );

create policy "Editors and admins can update all orders" on public.orders
  for update using ( public.is_admin_or_editor() );

-- Policies for order_items
create policy "Editors and admins can select all order_items" on public.order_items
  for select using ( public.is_admin_or_editor() );

create policy "Editors and admins can update all order_items" on public.order_items
  for update using ( public.is_admin_or_editor() );

-- Policies for profiles
create policy "Editors and admins can view all profiles" on public.profiles
  for select using ( public.is_admin_or_editor() );

-- Policies for events (Assuming table public.events exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    BEGIN
      create policy "Editors and admins can view all events" on public.events
        for select using ( public.is_admin_or_editor() );
    EXCEPTION WHEN duplicate_object THEN
      -- Policy might already exist, ignore
    END;
  END IF;
END $$;
