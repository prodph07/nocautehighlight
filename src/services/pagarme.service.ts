
import { type PaymentMethod } from '../types';
// import { supabase } from '../lib/supabase';

// Interfaces para o Pagar.me (simplificadas)
interface PagarmeOrderInput {
    amount: number; // em centavos
    description: string;
    payment_method: PaymentMethod;
    card_hash?: string; // Token do cartão para cartão de crédito
    customer: {
        name: string;
        email: string;
        document: string; // CPF
        phones: {
            mobile_phone: {
                country_code: string;
                area_code: string;
                number: string;
            }
        }
    };
}

export const PagarmeService = {
    async createTransaction(input: PagarmeOrderInput): Promise<{ id: string; status: string; qrcode?: string; qrcode_url?: string }> {
        console.log('Chamando Edge Function pagarme-checkout via RAW FETCH...');

        // const { data: { session } } = await supabase.auth.getSession();
        // FORCE ANON KEY to avoid 401 errors with potential bad user tokens
        // We can revert this to use session token later if RLS requires it
        const token = import.meta.env.VITE_SUPABASE_ANON_KEY;
        console.log('Using Anon Key for Edge Function.');

        // Helper to handle potential trailing slash in env var
        const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
        const functionUrl = `${baseUrl}/functions/v1/pagarme-checkout`;

        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(input)
            });

            console.log('Edge Function Status:', response.status);

            const responseText = await response.text();
            console.log('Edge Function Raw Body:', responseText);

            if (!response.ok) {
                let errorMessage = `Erro HTTP ${response.status}`;
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = JSON.parse(responseText);

            // Check if the function returned a "soft" error (status 200 but success: false)
            if (data.error) {
                throw new Error(data.error);
            }

            return data;

        } catch (error: any) {
            console.error('Erro no Fetch:', error);
            throw error;
        }
    }
};
