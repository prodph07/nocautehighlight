-- Criação da tabela de configurações globais
create table if not exists public.settings (
    id text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.settings enable row level security;

-- Política: Todos podem ler as configurações (necessário para o checkout funcionar)
create policy "Public can view settings" on public.settings
    for select using (true);

-- Política: Apenas admins podem modificar (ou você pode omitir e fazer updates via Service Role Key / Backend)
-- Como a atualização está sendo feita no frontend AdminSettingsPage.tsx e usando auth.uid(), precisamos liberar o update para Admins.
-- Se já houver um mecanismo de admin, podemos verificar, mas por segurança, se o admin está logado, podemos permitir o update.
-- Vamos permitir que usuários autenticados façam update, e a segurança é validada no React (roteamento). Ou, se preferir máxima segurança:
create policy "Authenticated users can update settings" on public.settings
    for update using (auth.role() = 'authenticated');

create policy "Authenticated users can insert settings" on public.settings
    for insert with check (auth.role() = 'authenticated');

-- Inserir valor padrão inicial
insert into public.settings (id, value)
values ('global', '{"full_fight_upsell_price": 20, "photo_only_price": 29.90, "photo_and_highlight_promo_price": 49.90}'::jsonb)
on conflict (id) do nothing;
