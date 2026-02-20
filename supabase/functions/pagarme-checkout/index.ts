
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
        const { amount, payment_method, customer, card_hash, description } = await req.json()

        if (!PAGARME_SECRET_KEY) {
            console.error('PAGARME_SECRET_KEY missing')
            throw new Error('Server configuration error: Missing Secret Key')
        }

        // Validate payload basics
        if (!amount || !customer) {
            throw new Error('Missing required fields: amount or customer')
        }

        // Prepare payload for Pagar.me V5
        const payload = {
            items: [
                {
                    amount: amount,
                    description: description,
                    quantity: 1,
                    code: 'video_access'
                }
            ],
            customer: {
                name: customer.name,
                email: customer.email,
                document: customer.document,
                type: 'individual',
                phones: {
                    mobile_phone: {
                        country_code: customer.phones.mobile_phone.country_code,
                        area_code: customer.phones.mobile_phone.area_code,
                        number: customer.phones.mobile_phone.number
                    }
                }
            },
            payments: [
                {
                    payment_method: payment_method,
                    credit_card: payment_method === 'credit_card' ? {
                        card: {
                            token: card_hash
                        },
                        operation_type: 'auth_and_capture',
                        installments: 1
                    } : undefined,
                    pix: payment_method === 'pix' ? {
                        expires_in: 3600 // 1 hour
                    } : undefined
                }
            ]
        }

        console.log('Sending to Pagar.me:', JSON.stringify(payload))

        const response = await fetch('https://api.pagar.me/core/v5/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(PAGARME_SECRET_KEY + ':')
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Pagar.me Error Body:', JSON.stringify(data))
            // Return 200 with error data so frontend can read it
            return new Response(
                JSON.stringify({ error: JSON.stringify(data), success: false }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
            )
        }

        // Extract relevant info based on payment method
        const charge = data.charges ? data.charges[0] : null
        const lastTransaction = charge ? charge.last_transaction : null

        let result = {
            id: data.id,
            status: data.status || (charge ? charge.status : 'pending'), // Prefer Order status, fallback to Charge status
            gateway_id: charge ? charge.id : null,
        }

        if (payment_method === 'pix' && lastTransaction) {
            result = {
                ...result,
                qrcode: lastTransaction.qr_code,
                qrcode_url: lastTransaction.qr_code_url
            }
        }

        // ADD FULL DEBUG DATA TO RESULT
        result = {
            ...result,
            debug_pagarme_charge_status: charge ? charge.status : null,
            debug_pagarme_last_transaction: lastTransaction,
            debug_pagarme_response: data
        }

        return new Response(
            JSON.stringify(result),
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
