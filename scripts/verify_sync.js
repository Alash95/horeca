import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

// Load environment variables manually if needed, or rely on --env-file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables. Use --env-file=.env or set them in shell.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySync() {
    console.log('🔍 Starting Data Integrity Audit...');

    // 1. Read Local CSV
    const csvFile = fs.readFileSync('temp_sheet_data.csv', 'utf8');
    const csvData = Papa.parse(csvFile, { header: true, skipEmptyLines: true }).data;
    console.log(`📄 Local CSV count: ${csvData.length} rows`);

    // 2. Query Supabase
    let allItems = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    process.stdout.write('📡 Fetching from Supabase...');
    while (hasMore) {
        const { data, error } = await supabase
            .from('menuitems')
            .select('count', { count: 'exact', head: true }); // Get count only for speed first

        if (error) {
            console.error('\n❌ Supabase error:', error.message);
            return;
        }

        // Actually we want the full count and some samples
        const { data: rows, error: rowError, count } = await supabase
            .from('menuitems')
            .select('*', { count: 'exact' })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (rowError) {
            console.error('\n❌ rowError:', rowError.message);
            return;
        }

        if (rows) {
            allItems = [...allItems, ...rows];
            if (rows.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }
    process.stdout.write(' DONE\n');

    console.log(`🗄️ Supabase record count: ${allItems.length} rows`);

    // 3. Compare Count
    if (Math.abs(csvData.length - allItems.length) < 5) { // Small delta allowed if data was added manually
        console.log('✅ RECORD COUNT MATCHES! (within tolerance)');
    } else {
        console.log('⚠️ RECORD COUNT MISMATCH!');
        console.log(`Delta: ${csvData.length - allItems.length} rows missing in Supabase.`);
    }

    // 4. Sample Check
    if (allItems.length > 0 && csvData.length > 0) {
        console.log('\n🧪 Sample Verification:');
        const sampleCsv = csvData[0];
        const sampleDb = allItems.find(item =>
            (item.Insegna || item.venue_name || '').toLowerCase() === (sampleCsv.Venue_Name || '').toLowerCase()
        );

        if (sampleDb) {
            console.log(`✅ Sample found: "${sampleCsv.Venue_Name}" is present in DB.`);
        } else {
            console.log(`❌ Sample check failed for "${sampleCsv.Venue_Name}".`);
        }
    }

    console.log('\n🏁 Audit Complete.');
}

verifySync();
