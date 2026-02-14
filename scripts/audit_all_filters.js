import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log('--- STARTING GLOBAL FILTER AUDIT ---');

    const columns = [
        'TipologiaLocale',
        'Città',
        'venue_city',
        'ingredients_brand_owner',
        'ingredients_brand',
        'Broad_category',
        'ingredients_categoria',
        'Item_Name'
    ];

    const { count: totalRows, error: te } = await supabase.from('menuitems').select('*', { count: 'exact', head: true });
    if (te) { console.error(te); return; }
    console.log(`Total Rows: ${totalRows}`);

    for (const col of columns) {
        const { count: nullCount } = await supabase.from('menuitems').select('*', { count: 'exact', head: true }).is(col, null);
        const { count: emptyCount } = await supabase.from('menuitems').select('*', { count: 'exact', head: true }).eq(col, '');
        const { count: unknownCount } = await supabase.from('menuitems').select('*', { count: 'exact', head: true }).ilike(col, 'unknown');

        console.log(`Column [${col}]:`);
        console.log(`  - NULL: ${nullCount}`);
        console.log(`  - Empty: ${emptyCount}`);
        console.log(`  - 'Unknown': ${unknownCount}`);
        console.log(`  - Validity: ${(((totalRows || 0) - (nullCount || 0) - (emptyCount || 0)) / (totalRows || 1) * 100).toFixed(1)}%`);
    }

    const { data: categories } = await supabase.from('menuitems').select('Broad_category').limit(100);
    console.log('\nSample Broad_category:', [...new Set(categories?.map(c => c.Broad_category))]);
}

audit();

async function auditUnique() {
    console.log('--- CHECKING UNIQUE VALUES FOR NORMALIZATION ---');

    const cols = ['TipologiaLocale', 'Broad_category', 'ingredients_categoria'];
    for (const col of cols) {
        const { data } = await supabase.from('menuitems').select(col);
        const unique = [...new Set(data?.map(d => d[col]))].filter(Boolean).sort();
        console.log(`\nUnique [${col}]: (${unique.length} values)`);
        console.log(JSON.stringify(unique, null, 2));
    }
}

auditUnique();
