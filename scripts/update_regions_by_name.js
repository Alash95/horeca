import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

const mapping = [
    { pattern: '% Mi%', region: 'Lombardia' },
    { pattern: '% Milano%', region: 'Lombardia' },
    { pattern: '% Milan%', region: 'Lombardia' },
    { pattern: '% Ve%', region: 'Veneto' },
    { pattern: '% Venice%', region: 'Veneto' },
    { pattern: '% Venezia%', region: 'Veneto' },
    { pattern: '% To%', region: 'Piemonte' },
    { pattern: '% Torino%', region: 'Piemonte' },
    { pattern: '% Turin%', region: 'Piemonte' },
    { pattern: '% Rm%', region: 'Lazio' },
    { pattern: '% Roma%', region: 'Lazio' },
    { pattern: '% Rome%', region: 'Lazio' },
    { pattern: '% Fi%', region: 'Toscana' },
    { pattern: '% Firenze%', region: 'Toscana' },
    { pattern: '% Florence%', region: 'Toscana' },
    { pattern: '% Na%', region: 'Campania' },
    { pattern: '% Napoli%', region: 'Campania' },
    { pattern: '% Naples%', region: 'Campania' },
    { pattern: '% Bo%', region: 'Emilia-Romagna' },
    { pattern: '% Bologna%', region: 'Emilia-Romagna' },
    { pattern: '% Ba%', region: 'Puglia' },
    { pattern: '% Bari%', region: 'Puglia' },
    { pattern: '% Ge%', region: 'Liguria' },
    { pattern: '% Genova%', region: 'Liguria' },
    { pattern: '% Pa%', region: 'Sicilia' },
    { pattern: '% Palermo%', region: 'Sicilia' },
    { pattern: '% Vr%', region: 'Veneto' },
    { pattern: '% Verona%', region: 'Veneto' },
];

async function forceUpdateByNomeLocale() {
    console.log('--- Forcing RegionMatch Update by NomeLocale keywords ---');

    let totalUpdated = 0;

    for (const item of mapping) {
        const { pattern, region } = item;

        // We update EVERY match to ensure NomeLocale is "running" the data
        const { data, error, count } = await supabase
            .from('menuitems')
            .update({ RegionMatch: region })
            .ilike('NomeLocale', pattern)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Error updating ${region} with ${pattern}:`, error);
        } else {
            if (count > 0) {
                console.log(`Updated ${count} rows for ${region} (Pattern: ${pattern})`);
                totalUpdated += count;
            }
        }
    }

    console.log(`\nTotal rows updated via NomeLocale keywords: ${totalUpdated}`);
}

forceUpdateByNomeLocale();
