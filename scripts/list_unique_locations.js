import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listRemainingLocations() {
    const { data, error } = await supabase
        .from('menuitems')
        .select('venue_city, venue_state')
        .or('RegionMatch.is.null,RegionMatch.eq.""');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const seen = new Set();
    const unique = [];

    data.forEach(row => {
        const key = `${row.venue_city}|${row.venue_state}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(row);
        }
    });

    console.log('--- Remaining Unique combinations of City/State ---');
    unique.slice(0, 50).forEach(u => {
        console.log(`City: [${u.venue_city}] | State: [${u.venue_state}]`);
    });
}

listRemainingLocations();
