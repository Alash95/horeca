import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verify() {
    console.log('📡 Accessing Supabase with Service Role (Bypassing RLS)...');

    const { count, error } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Success! Total Row Count found: ${count}`);

        // Fetch a sample row to confirm headers
        const { data: sample } = await supabase.from('menuitems').select('*').limit(1);
        if (sample && sample.length > 0) {
            console.log('📊 Schema Confirmation (Production Headers):');
            console.log(JSON.stringify(Object.keys(sample[0]), null, 2));
            console.log('\n💎 Sample Data (Ensuring English contents):');
            console.log(JSON.stringify(sample[0], null, 2));
        }
    }
}

verify();
