import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function countNulls() {
    const { count, error } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true });

    const { count: nullCount, error: nullError } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true })
        .or('RegionMatch.is.null,RegionMatch.eq.""');

    if (error || nullError) {
        console.error('Error:', error || nullError);
        return;
    }

    console.log(`Total rows: ${count}`);
    console.log(`Rows with missing RegionMatch: ${nullCount}`);
    console.log(`Percentage missing: ${((nullCount / count) * 100).toFixed(2)}%`);

    // Get top 20 venues with missing regions
    const { data: venues, error: venueError } = await supabase
        .from('menuitems')
        .select('NomeLocale, venue_city, venue_state')
        .or('RegionMatch.is.null,RegionMatch.eq.""')
        .limit(20);

    if (venueError) {
        console.error('Error fetching venues:', venueError);
    } else {
        console.log('\nSample venues with missing regions:');
        venues.forEach(v => console.log(`- ${v.NomeLocale} (${v.venue_city}, ${v.venue_state})`));
    }
}

countNulls();
