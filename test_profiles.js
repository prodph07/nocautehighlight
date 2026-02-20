import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking profiles table...");

    // Test fetch
    const { data, error } = await supabase.from('profiles').select('id, full_name, email, whatsapp, cpf').limit(1);

    console.log("Data result:", data);
    console.log("Error finding CPF:", error?.message);

    if (error && error.message.includes('cpf')) {
        console.log("--THE CPF COLUMN IS MISSING--");
    }
}

check();
