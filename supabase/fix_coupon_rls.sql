-- Função para incrementar com segurança o uso de um cupom
-- Essa função ignora as restrições do RLS (security definer)
-- para permitir que usuários comuns durante o checkout possam contabilizar o uso do cupom.

create or replace function public.increment_coupon_uses(p_coupon_id uuid)
returns void
language plpgsql
security definer -- Isso permite que a função rode com permissões de administrador
as $$
begin
  update public.coupons
  set current_uses = current_uses + 1
  where id = p_coupon_id
  and active = true
  and (max_uses is null or current_uses < max_uses);
end;
$$;
