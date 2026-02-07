import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccess() {
    console.log('📡 Checking access to public.menuitems...');

    // Try to select just the count - this usually works if RLS allows 'anon' read
    const { count, error: countError } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Count Error:', countError.message);
    } else {
        console.log(`✅ Success! I can see the total row count: ${count}`);
    }

    // Try to select one row to see if RLS restricts content
    const { data, error: dataError } = await supabase
        .from('menuitems')
        .select('*')
        .limit(1);

    if (dataError) {
        console.error('❌ Data Access Error:', dataError.message);
    } else if (data && data.length > 0) {
        console.log('✅ Content Access: I can see the data content!');
        console.log('Sample Row Headers:', Object.keys(data[0]));
    } else {
        console.log('⚠️ Content Access: Table appears empty to the "anon" role. This confirms RLS is blocking unauthenticated access.');
    }
}

checkAccess();
