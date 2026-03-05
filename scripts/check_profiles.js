import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Authenticating as Admin to bypass RLS for fetching...");
    await supabase.auth.signInWithPassword({
        email: 'admin@highnocaute.com.br',
        password: '27510756',
    });

    // Check profiles directly to see if the previous script actually worked
    console.log("\nChecking all profiles in DB:");
    const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(10);

    if (pErr) console.error("Error fetching profiles:", pErr);
    else console.log(JSON.stringify(profs, null, 2));
}

check();
