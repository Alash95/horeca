import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getColumns() {
    // Using direct SQL via potentially existed RPC or just trying to guess
    // Actually, let's try a different approach: check if we can query postgres tables directly if the user has permissions
    const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error.message);
    } else {
        console.log('Sample data keys:', data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    }
}

// Since table is empty, we can try to use standard postgres catalog queries if exposed via RPC or REST
// But usually information_schema is not exposed via PostgREST for safety.
// Let's try to find if there's an 'items' table or similar.

getColumns();
