import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLocationFields() {
    const { data, error } = await supabase
        .from('menuitems')
        .select('NomeLocale, RegionMatch, venue_city, venue_state')
        .or('RegionMatch.is.null,RegionMatch.eq.""')
        .limit(50);

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(row => {
        console.log(`Venue: ${row.NomeLocale} | City: ${row.venue_city} | State: ${row.venue_state} | Region: ${row.RegionMatch}`);
    });
}

inspectLocationFields();
