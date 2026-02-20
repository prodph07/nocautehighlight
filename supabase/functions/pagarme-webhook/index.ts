// deno-lint-ignore-file
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pagar.me sends webhook data as JSON
    const payload = await req.json()

    console.log("Recebendo Webhook do Pagar.me!", JSON.stringify(payload, null, 2))

    // We only care about specific events, primarily Order Paid.
    // The event type is usually something like 'order.paid' or 'charge.paid'
    const eventType = payload.type;
    const eventData = payload.data;

    if (!eventType || !eventData) {
      return new Response('Ignored - Invalid Payload Structure', { status: 200 })
    }

    let newStatus = null;
    let gatewayId = null;

    if (eventType === 'order.paid') {
      newStatus = 'paid';
      gatewayId = eventData.id; // Or charges[0].id depending on how it was saved
    } else if (eventType === 'charge.paid') {
      newStatus = 'paid';
      gatewayId = eventData.order.id; // Usually charge webhook links back to order
      // NOTE: Our checkout saves the charge.id as gateway_id. Let's try to match by charge ID if this is a charge event
      if (eventData.id) {
        gatewayId = eventData.id;
      }
    } else if (eventType.includes('failed') || eventType.includes('canceled')) {
      newStatus = 'failed';
      gatewayId = eventData.id;
    }

    // If we didn't determine a relevant status change, just return 200 OK so Pagar.me stops retrying
    if (!newStatus) {
      console.log(`Evento ignorado (não altera status para pago ou falho): ${eventType}`);
      return new Response('Ignored - Event Type Not Handled', { status: 200 })
    }

    // We need an elevated client (Service Role) to bypass RLS and update orders table securely
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing ENV Vars (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
      return new Response('Server Config Error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Find the order that matches the gateway_id (which might be the order.id or charge.id)
    // Since our createTransaction saves `charge.id` as `gateway_id`, we try that first
    let orderToUpdateId = null;

    // Tenta achar com o charge.id
    const { data: ordersByGateway, error: findErr1 } = await supabase
      .from('orders')
      .select('id')
      .eq('gateway_id', eventData.id) // If event is charge.paid, data.id is the charge ID
      .limit(1);

    if (ordersByGateway && ordersByGateway.length > 0) {
      orderToUpdateId = ordersByGateway[0].id;
    } else if (eventData.order && eventData.order.id) {
      // Tenta achar com o order.id pai (caso o webhook seja charge.paid mas a gente tenha salvo order.id)
      const { data: ordersByOrder, error: findErr2 } = await supabase
        .from('orders')
        .select('id')
        .eq('gateway_id', eventData.order.id)
        .limit(1);

      if (ordersByOrder && ordersByOrder.length > 0) {
        orderToUpdateId = ordersByOrder[0].id;
      }
    }

    if (!orderToUpdateId) {
      console.error(`Pedido não encontrado no banco para o gateway_id: ${eventData.id} ou ${eventData.order?.id}`);
      return new Response('Order Not Found in DB', { status: 200 }); // Status 200 so Pagar.me knows we processed it, even if failed internally
    }

    console.log(`Atualizando Pedido ${orderToUpdateId} para status: ${newStatus}`);

    // Update the database
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderToUpdateId);

    if (updateErr) {
      console.error("Erro ao atualizar o pedido no banco:", updateErr);
      return new Response('Database Update Failed', { status: 500 })
    }

    console.log("Pedido atualizado com sucesso via Webhook!");

    // Pagar.me REQUIRES a 200 OK fast response, otherwise it will keep retrying and eventually disable the webhook
    return new Response(JSON.stringify({ received: true, updated_order: orderToUpdateId, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error', success: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    )
  }
})
