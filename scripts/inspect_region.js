import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('--- Inspecting first 10 rows ---');
    const { data, error } = await supabase
        .from('menuitems')
        .select('NomeLocale, Città, RegionMatch, venue_city, venue_state')
        .limit(10);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.table(data);

    console.log('\n--- Checking for empty regions ---');
    const { count, error: countError } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true })
        .or('RegionMatch.is.null,RegionMatch.eq.""');

    if (countError) {
        console.error('Error counting empty regions:', countError);
    } else {
        console.log('Total rows with missing RegionMatch:', count);
    }

    console.log('\n--- Sample rows with missing regions ---');
    const { data: missingRows, error: missingError } = await supabase
        .from('menuitems')
        .select('NomeLocale, Città, RegionMatch')
        .or('RegionMatch.is.null,RegionMatch.eq.""')
        .limit(20);

    if (missingError) {
        console.error('Error fetching missing rows:', missingError);
    } else {
        console.table(missingRows);
    }
}

inspectData();
