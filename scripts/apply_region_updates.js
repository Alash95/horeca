import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRegionUpdates() {
    let sqlPath = path.join(process.cwd(), 'region_match_updates_refined.sql');
    let useRefined = true;

    if (!fs.existsSync(sqlPath)) {
        // Fallback to original for safety
        sqlPath = path.join(process.cwd(), 'region_match_updates.sql');
        useRefined = false;
    }

    if (!fs.existsSync(sqlPath)) {
        console.error(`❌ SQL file not found.`);
        return;
    }

    console.log(`📖 Reading ${path.basename(sqlPath)}...`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Regex to find UPDATE blocks
    const updateRegex = /UPDATE\s+menuitems\s+SET\s+"RegionMatch"\s+=\s+'([^']+)'\s+WHERE\s+"Menu ID"\s+([^;]+);/gi;

    let match;
    const updates = [];

    while ((match = updateRegex.exec(sqlContent)) !== null) {
        const region = match[1];
        const condition = match[2];
        updates.push({ region, condition });
    }

    console.log(`🚀 Found ${updates.length} update commands. Applying...`);

    for (const update of updates) {
        const { region, condition } = update;
        // console.log(`  - Setting '${region}' where ID ${condition}...`);

        let query = supabase.from('menuitems').update({ RegionMatch: region });

        // Handle BETWEEN start AND end
        if (condition.includes('BETWEEN')) {
            const betweenMatch = /BETWEEN\s+(\d+)\s+AND\s+(\d+)/i.exec(condition);
            if (betweenMatch) {
                const start = parseInt(betweenMatch[1]);
                const end = parseInt(betweenMatch[2]);
                const { error } = await query.gte('Menu ID', start).lte('Menu ID', end);
                if (error) console.error(`    ❌ Error ID ${condition}: ${error.message}`);
            }
        }
        // Handle >= value
        else if (condition.includes('>=')) {
            const geMatch = />=\s+(\d+)/i.exec(condition);
            if (geMatch) {
                const value = parseInt(geMatch[1]);
                const { error } = await query.gte('Menu ID', value);
                if (error) console.error(`    ❌ Error ID ${condition}: ${error.message}`);
            }
        }
        // Handle = value (Exact match)
        else if (condition.includes('=')) {
            const eqMatch = /=\s+(\d+)/i.exec(condition);
            if (eqMatch) {
                const value = parseInt(eqMatch[1]);
                const { error } = await query.eq('Menu ID', value);
                if (error) console.error(`    ❌ Error ID ${condition}: ${error.message}`);
            }
        }
        else {
            console.warn(`    ⚠️ Unrecognized condition: ${condition}`);
        }
    }

    console.log('\n✨ All updates processed.');
}

applyRegionUpdates().catch(err => {
    console.error('💥 Critical script failure:', err);
});
