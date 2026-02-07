import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // Querying information_schema via a trick if possible, or just trying a few names
    const tablesToTry = ['menuitems', 'MenuItems', 'menu_items', 'ProductMaster', 'users', 'blacklist'];

    for (const table of tablesToTry) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`✅ Table "${table}" exists. Row count: ${count}`);
            // Try to get columns by selecting a limit 0 row
            const { data: cols } = await supabase.from(table).select('*').limit(1);
            if (cols) console.log(`   Columns: ${Object.keys(cols[0] || {}).join(', ')}`);
        } else {
            console.log(`❌ Table "${table}" error: ${error.message}`);
        }
    }
}

listTables();
