import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
    console.log('🚀 Starting Data Upload with Exact Headers...');

    // 1. Read CSV
    const csvFile = fs.readFileSync('temp_sheet_data.csv', 'utf8');
    const csvData = Papa.parse(csvFile, { header: true, skipEmptyLines: true }).data;
    console.log(`📄 Read ${csvData.length} rows from CSV.`);

    // 2. Map to Supabase columns using EXACT CSV HEADERS
    const mappedData = csvData.map(row => ({
        "Region": row.Region,
        "City": row.City,
        "Venue_Name": row.Venue_Name,
        "Customer_Type": row.Customer_Type,
        "BrandOwner": row.BrandOwner,
        "Brand": row.Brand,
        "MacroCategory": row.MacroCategory,
        "Product_Category": row.Product_Category,
        "CocktailName": row.CocktailName,
        "Price": parseFloat(String(row.Price).replace('€', '').trim()) || 0,
        "Top4": row.Top4
    }));

    // Chunk inserts
    const chunkSize = 100;
    for (let i = 0; i < mappedData.length; i += chunkSize) {
        const chunk = mappedData.slice(i, i + chunkSize);
        const { error } = await supabase.from('menuitems').insert(chunk);

        if (error) {
            console.error(`\n❌ Error at row ${i}:`, error.message);
            console.log('Sample Row keys:', Object.keys(chunk[0]));
            break;
        }
        process.stdout.write(`✅ Uploaded ${Math.min(i + chunkSize, mappedData.length)}/${mappedData.length}\r`);
    }

    console.log('\n🏁 Upload attempt finished.');
}

upload();
