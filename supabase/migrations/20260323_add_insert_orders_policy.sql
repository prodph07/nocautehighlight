-- Migration: Add RLS policies for editors and admins to insert orders and order_items

create policy "Editors and admins can insert orders" on public.orders
  for insert with check ( public.is_admin_or_editor() );

create policy "Editors and admins can insert order_items" on public.order_items
  for insert with check ( public.is_admin_or_editor() );
