import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = [
    { keywords: ['milan', 'milano'], region: 'Lombardia' },
    { keywords: ['venice', 'venezia'], region: 'Veneto' },
    { keywords: ['turin', 'torino'], region: 'Piemonte' },
    { keywords: ['rome', 'roma'], region: 'Lazio' },
    { keywords: ['florence', 'firenze'], region: 'Toscana' },
    { keywords: ['naples', 'napoli'], region: 'Campania' },
    { keywords: ['bologna'], region: 'Emilia-Romagna' },
    { keywords: ['bari'], region: 'Puglia' },
    { keywords: ['genoa', 'genova'], region: 'Liguria' },
    { keywords: ['palermo'], region: 'Sicilia' },
    { keywords: ['verona'], region: 'Veneto' },
    { keywords: ['amalfi', 'positano', 'sorrento'], region: 'Campania' },
    { keywords: ['como', 'gardone', 'garda'], region: 'Lombardia' }, // Gardone is and Garda can be, but Como definitely
    { keywords: ['porto cervo', 'arzachena', 'sardinia'], region: 'Sardegna' },
];

async function updateRegions() {
    console.log('--- Starting Bulk Update ---');

    let totalUpdated = 0;

    for (const item of mapping) {
        const { keywords, region } = item;

        console.log(`Processing region: ${region} using keywords: ${keywords.join(', ')}...`);

        const orCondition = keywords.map(k => `venue_city.ilike.%${k}%,venue_state.ilike.%${k}%,NomeLocale.ilike.%${k}%`).join(',');

        const { data, error, count } = await supabase
            .from('menuitems')
            .update({ RegionMatch: region })
            .or(orCondition)
            .or('RegionMatch.is.null,RegionMatch.eq.""')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Error updating ${region}:`, error);
        } else {
            console.log(`Updated ${count || 0} rows for ${region}`);
            totalUpdated += (count || 0);
        }
    }

    console.log(`\n--- Bulk Update Complete ---`);
    console.log(`Total rows updated: ${totalUpdated}`);
}

updateRegions();
