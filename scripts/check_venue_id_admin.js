
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
        if (key && key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value.trim();
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!supabaseKey) {
    console.error("No Service Role Key found. Cannot bypass RLS.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking samples with Service Role Key...");
    const { data, error } = await supabase
        .from('menuitems')
        .select('"Menu ID", NomeLocale')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log("Sample Data:");
    console.table(data);
}

check();
