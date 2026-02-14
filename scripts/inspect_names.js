import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectNames() {
    const { data, error } = await supabase
        .from('menuitems')
        .select('NomeLocale, RegionMatch')
        .limit(500);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const nullRegions = data.filter(row => row.RegionMatch === null || row.RegionMatch === '');
    console.log(`Found ${nullRegions.length} rows with null RegionMatch out of 500.`);

    // Group by NomeLocale to see unique venues
    const uniqueVenues = [...new Set(nullRegions.map(r => r.NomeLocale))];
    console.log('Sample Unique Venues with null RegionMatch:');
    uniqueVenues.slice(0, 50).forEach(v => console.log(`- ${v}`));
}

inspectNames();
