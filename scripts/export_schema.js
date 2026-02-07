import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function exportSchema() {
    console.log('📡 Fetching schema from menuitems...');

    const { data: sample, error } = await supabase
        .from('menuitems')
        .select('*')
        .limit(50);

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }

    const result = {
        headers: sample && sample.length > 0 ? Object.keys(sample[0]) : [],
        sample: sample && sample.length > 0 ? sample[0] : null
    };

    fs.writeFileSync('db_schema_info.json', JSON.stringify(result, null, 2));
    console.log('✅ Schema info written to db_schema_info.json');
}

exportSchema();
