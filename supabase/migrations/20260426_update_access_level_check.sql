-- Remover a restrição antiga que só permitia highlight e full_fight
alter table public.order_items drop constraint if exists order_items_access_level_check;

-- Adicionar a nova restrição permitindo os novos níveis de acesso das fotos
alter table public.order_items add constraint order_items_access_level_check check (
    access_level in ('highlight_only', 'full_access', 'photo_only', 'photo_and_highlight', 'photo_and_full_access')
);
