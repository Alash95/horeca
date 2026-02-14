import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listVenuesWithNoLocation() {
    const { data, error } = await supabase
        .from('menuitems')
        .select('NomeLocale')
        .or('RegionMatch.is.null,RegionMatch.eq.""')
        .or('venue_city.is.null,venue_city.eq.""');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const uniqueVenues = [...new Set(data.map(r => r.NomeLocale))];
    console.log(`--- ${uniqueVenues.length} Unique Venues with NO Location data ---`);
    uniqueVenues.slice(0, 50).forEach(v => console.log(`- ${v}`));
}

listVenuesWithNoLocation();
