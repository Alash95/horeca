import { createClient } from '@supabase/supabase-js';
// Rely on --env-file=.env.local flag in Node 20+

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkUsers() {
    console.log('📡 Fetching users from public.users...');
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('❌ Error fetching public.users:', error.message);
    } else {
        console.log('✅ Users found in public.users:');
        users.forEach(u => {
            console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`);
        });
    }

    console.log('\n📡 Fetching users from auth.users (requires service role)...');
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Error fetching auth.users:', authError.message);
    } else {
        console.log('✅ Users found in auth.users:');
        authUsers.forEach(u => {
            console.log(`- ID: ${u.id} | Email: ${u.email} | Confirmed: ${u.confirmed_at ? 'Yes' : 'No'}`);
        });
    }
}

checkUsers();
