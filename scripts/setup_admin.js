import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE URL or SERVICE ROLE KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    try {
        console.log("Adding is_admin column and updating RLS policies via SQL query string...");

        // We can execute SQL from node via pg directly, but to keep it simple, let's use the REST endpoint
        // Unfortunately standard JS client doesn't execute DDL via rpc easily unless we have an exec_sql function.
        // Let's create the user first, and we can run SQL manually if needed.

        console.log("Creating Admin User...");

        const email = 'admin@highnocaute.com.br';
        const password = '27510756';

        const { data: userRecord, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: 'Administrador'
            }
        });

        if (createError) {
            console.error("Error creating user:", createError);
            if (createError.message.includes("User already registered")) {
                console.log("User might already exist. Proceeding to set is_admin anyway...");
            } else {
                throw createError;
            }
        } else {
            console.log("Admin user created in auth.users:", userRecord.user.id);
        }

        // Find user by email
        const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
        if (fetchError) throw fetchError;

        const adminUser = users.users.find(u => u.email === email);
        if (!adminUser) throw new Error("Could not find admin user after creation attempt.");

        console.log("Admin user ID:", adminUser.id);

        // Update profile
        console.log("Setting is_admin flag in profiles...");
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: adminUser.id,
            email: adminUser.email,
            full_name: 'Administrador',
            is_admin: true
        });

        if (profileError) {
            console.error("Failed to update profile. Ensure the is_admin column exists via SQL runner first:", profileError);
            throw profileError;
        }

        console.log("Admin setup complete!");

    } catch (err) {
        console.error("Failed to setup admin:", err);
    }
}

main();
