import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for schema inspection

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'menuitems' });

    if (error) {
        // Fallback if RPC doesn't exist: try a sample row or common columns
        const { data: sample, error: sampleError } = await supabase.from('menuitems').select('*').limit(1);
        if (sampleError) {
            console.error('Error:', sampleError.message);
        } else if (sample && sample.length > 0) {
            console.log('Columns found in sample row:', Object.keys(sample[0]));
        } else {
            console.log('Table is empty and no sample available. Trying to fetch common columns via SQL proxy or similar.');
            // If we can't find columns, we'll assume standard naming or ask user.
        }
    } else {
        console.log('Schema:', data);
    }
}

inspectSchema();
