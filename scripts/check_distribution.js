import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDistribution() {
    console.log('--- Full Region Distribution ---');

    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('menuitems')
            .select('RegionMatch')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error:', error);
            return;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) hasMore = false;
            else page++;
        } else {
            hasMore = false;
        }
    }

    const counts = {};
    let nullCount = 0;
    allData.forEach(row => {
        if (!row.RegionMatch) {
            nullCount++;
        } else {
            counts[row.RegionMatch] = (counts[row.RegionMatch] || 0) + 1;
        }
    });

    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
        console.log(`${region}: ${count}`);
    });
    console.log(`\nRemaining Nulls: ${nullCount}`);
    console.log(`Total Rows: ${allData.length}`);
}

checkDistribution();
