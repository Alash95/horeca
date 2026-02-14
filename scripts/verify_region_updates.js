import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUpdates() {
    console.log('🔍 Verifying RegionMatch updates...');

    const checks = [
        { id: 1, expected: 'Lombardy' },
        { id: 300, expected: 'Veneto' },
        { id: 400, expected: 'Piedmont' },
        { id: 700, expected: 'Unknown' },
        { id: 2800, expected: 'Lazio' },
        { id: 4000, expected: 'Sicily' },
        { id: 4500, expected: 'Lombardy' }
    ];

    for (const check of checks) {
        const { data, error } = await supabase
            .from('menuitems')
            .select('RegionMatch, NomeLocale')
            .eq('Menu ID', check.id)
            .maybeSingle();

        if (error) {
            console.error(`  ❌ Error checking ID ${check.id}: ${error.message}`);
        } else if (data) {
            const match = data.RegionMatch === check.expected ? '✅' : '❌';
            console.log(`  ${match} ID ${check.id} (${data.NomeLocale}): Expected ${check.expected}, Got ${data.RegionMatch}`);
        } else {
            console.log(`  ⚠️ ID ${check.id} not found.`);
        }
    }
}

verifyUpdates().catch(console.error);
