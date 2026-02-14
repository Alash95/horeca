
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
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars in .env.local', env);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("🔍 Diagnosing Cocktail Filter Data...");

    const { data, error } = await supabase
        .from('menuitems')
        .select('*')
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    // Check mapping logic similar to DataProvider.tsx
    console.log("\n📊 Sample Row Extraction:");
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`);
        console.log(`  Item_Name: ${row.Item_Name}`);
        console.log(`  CocktailName (if exists): ${row.CocktailName}`);
        console.log(`  ingredients_categoria: ${row.ingredients_categoria}`);
        console.log(`  Broad_category: ${row.Broad_category}`);
        console.log(`  categoriaProdotto: ${row.categoriaProdotto}`);
        console.log(`  macroCategoria: ${row.macroCategoria}`);
    });

    // Count items matching the "LIKE cocktail" check
    let matchesCount = 0;
    const matchSamples = [];

    data.forEach(row => {
        const cat = (row.ingredients_categoria || row.categoriaProdotto || '').toLowerCase();
        const macro = (row.Broad_category || row.macroCategoria || '').toLowerCase();
        const name = row.Item_Name || row.CocktailName || '';

        if (cat.includes('cocktail') || macro.includes('cocktail')) {
            matchesCount++;
            if (matchSamples.length < 10) {
                matchSamples.push({ name, cat, macro });
            }
        }
    });

    console.log(`\n✅ Found ${matchesCount} / ${data.length} items matching "cocktail" category search.`);
    console.log("Samples:", JSON.stringify(matchSamples, null, 2));
}

diagnose();
