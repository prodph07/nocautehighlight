import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://curdgqqmaqrkomllrpmr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cmRncXFtYXFya29tbGxycG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjIxODIsImV4cCI6MjA4NzAzODE4Mn0.8lg6AzyC_dGKWhN6Lh9itpxQX3JcOBPjGOdRg7BLa7A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Fetching orders using Anon Key...");

    // We cannot just select orders because of RLS. 
    // Wait, AdminDashboard view does not have RLS? Yes, RLS is on for orders.
    // If the AdminDashboard can view orders, it's because the admin has a role or policies allow them. 
    // Actually, users can only view their OWN orders. 
    // Let me try calling a Postgres function if any, or just ask the user.
    // Let me just query the `videos` to make sure the connection works.
    const { data, error } = await supabase.from('videos').select('*').limit(1);
    console.log("Videos Connection:", data ? "OK" : error);
}

check();
