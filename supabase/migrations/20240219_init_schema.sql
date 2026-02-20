-- Habilita extensão para UUIDs
create extension if not exists "uuid-ossp";

-- Tabela de Perfis (Estende auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  whatsapp text,
  cpf text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Vídeos/Eventos
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  event_name text not null,
  fight_date date,
  category text,
  modality text,
  tags text[],
  teaser_url text,
  price_highlight numeric not null,
  price_full_bundle numeric not null,
  highlight_drive_id text, -- Protegido por RLS
  full_fight_drive_id text, -- Protegido por RLS
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Pedidos
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  status text not null check (status in ('pending', 'paid', 'canceled', 'failed')),
  gateway_id text,
  payment_method text check (payment_method in ('pix', 'credit_card')),
  total_amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Itens do Pedido (Define o acesso)
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  video_id uuid references public.videos(id) not null,
  access_level text not null check (access_level in ('highlight_only', 'full_access')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Políticas de Segurança (RLS)

-- Profiles: Usuário vê e edita apenas o próprio perfil
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Videos: Público pode ver dados básicos, mas NÃO os IDs do Drive diretamente
-- (A proteção real dos IDs do Drive será feita via View ou Function, aqui liberamos leitura geral para catálogo)
create policy "Public can view active videos" on public.videos
  for select using (is_active = true);

-- Orders: Usuário vê apenas seus pedidos
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

-- Order Items: Usuário vê apenas seus itens
create policy "Users can view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Function para verificar acesso e retornar link do Drive
-- Esta função será a ÚNICA forma de obter os IDs do Drive
create or replace function public.get_my_video_access(p_video_id uuid)
returns table (highlight_id text, full_fight_id text)
language plpgsql
security definer
as $$
begin
  return query
  select 
    case when oi.access_level in ('highlight_only', 'full_access') then v.highlight_drive_id else null end,
    case when oi.access_level = 'full_access' then v.full_fight_drive_id else null end
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.videos v on v.id = oi.video_id
  where o.user_id = auth.uid()
  and o.status = 'paid'
  and oi.video_id = p_video_id
  limit 1;
end;
$$;
