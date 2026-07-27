// deno-lint-ignore-file
const PAGARME_SECRET_KEY = Deno.env.get('PAGARME_SECRET_KEY')

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
        if (!PAGARME_SECRET_KEY) {
            throw new Error('Server configuration error: Missing Secret Key')
        }

        const authHeader = 'Basic ' + btoa(PAGARME_SECRET_KEY + ':')

        // Vamos buscar o saldo do seu recebedor principal diretamente pelo ID
        const recipientId = 're_cml6yailo8uor0l9tojdu5tsk';

        const balanceResponse = await fetch(`https://api.pagar.me/core/v5/recipients/${recipientId}/balance`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!balanceResponse.ok) {
            const errorData = await balanceResponse.json();
            throw new Error(`Failed to fetch balance: ${JSON.stringify(errorData)}`);
        }

        const balanceData = await balanceResponse.json();

        return new Response(
            JSON.stringify({ 
                success: true, 
                data: {
                    available_amount: balanceData.available_amount || 0,
                    waiting_funds_amount: balanceData.waiting_funds_amount || 0
                } 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        )

    } catch (error) {
        console.error('Internal Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error', success: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        )
    }
})
