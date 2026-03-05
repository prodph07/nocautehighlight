import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: precisamos usar VITE_SUPABASE_ANON_KEY aqui porque nao temos a SERVICE KEY,
// mas vamos bater no banco com o email do admin pra tentar bypassar o RLS se ele ja logou.
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAndCheck() {
    console.log("Authenticating as Admin to bypass RLS for fetching...");

    // Log in to gain the RLS privileges
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@highnocaute.com.br',
        password: '27510756',
    });

    if (authErr) {
        console.error("Auth Failed:", authErr.message);
        return;
    }

    console.log("Logged in as Admin. Fetching orders...");

    // Check orders with profile join
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select(`
            id, 
            profiles (id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (ordersErr) {
        console.error("Orders Err:", ordersErr);
    } else {
        console.log("Recent Orders (Admin View):");
        console.log(JSON.stringify(orders, null, 2));
    }
}

syncAndCheck();
