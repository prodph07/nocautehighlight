import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log("Fetching orders to see profile joins...");
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, 
            user_id,
            profiles (id, full_name, email, cpf, whatsapp)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching:", error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));

    console.log("\nChecking all profiles directly:");
    const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(5);

    if (pErr) console.error(pErr);
    else console.log(JSON.stringify(profs, null, 2));
}

checkOrders();
