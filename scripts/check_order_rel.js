import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    await supabase.auth.signInWithPassword({
        email: 'admin@highnocaute.com.br',
        password: '27510756',
    });

    console.log("Fetching order #1 raw details:");
    const { data: o, error: e } = await supabase
        .from('orders')
        .select('*')
        .limit(2);

    console.log(o);
}

inspect();
