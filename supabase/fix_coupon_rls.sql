-- Função para incrementar com segurança o uso de um cupom
-- Essa função ignora as restrições do RLS (security definer)
-- para permitir que usuários comuns durante o checkout possam contabilizar o uso do cupom.

create or replace function public.increment_coupon_uses(p_coupon_id uuid)
returns void
language plpgsql
security definer -- Isso permite que a função rode com permissões de administrador (bypass do RLS da tabela coupons)
as $$
begin
  update public.coupons
  set current_uses = coalesce(current_uses, 0) + 1
  where id = p_coupon_id
  and active = true
  and (max_uses is null or coalesce(current_uses, 0) < max_uses);
end;
$$;
