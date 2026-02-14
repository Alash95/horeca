import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

const cityRegionMap = [
    { city: 'Milano', region: 'Lombardia' },
    { city: 'Milan', region: 'Lombardia' },
    { city: 'Venezia', region: 'Veneto' },
    { city: 'Venice', region: 'Veneto' },
    { city: 'Torino', region: 'Piemonte' },
    { city: 'Turin', region: 'Piemonte' },
    { city: 'Roma', region: 'Lazio' },
    { city: 'Rome', region: 'Lazio' },
    { city: 'Firenze', region: 'Toscana' },
    { city: 'Florence', region: 'Toscana' },
    { city: 'Napoli', region: 'Campania' },
    { city: 'Naples', region: 'Campania' },
    { city: 'Bologna', region: 'Emilia-Romagna' },
    { city: 'Bari', region: 'Puglia' },
    { city: 'Genova', region: 'Liguria' },
    { city: 'Genoa', region: 'Liguria' },
    { city: 'Palermo', region: 'Sicilia' },
    { city: 'Verona', region: 'Veneto' },
    { city: 'Catania', region: 'Sicilia' },
    { city: 'Padova', region: 'Veneto' },
    { city: 'Padua', region: 'Veneto' },
    { city: 'Trieste', region: 'Friuli-Venezia Giulia' },
    { city: 'Brescia', region: 'Lombardia' },
    { city: 'Parma', region: 'Emilia-Romagna' },
    { city: 'Modena', region: 'Emilia-Romagna' },
    { city: 'Perugia', region: 'Umbria' },
    { city: 'Livorno', region: 'Toscana' },
    { city: 'Cagliari', region: 'Sardegna' },
    { city: 'Salerno', region: 'Campania' },
    { city: 'Rimini', region: 'Emilia-Romagna' },
    { city: 'Como', region: 'Lombardia' },
    { city: 'Bergamo', region: 'Lombardia' },
    { city: 'Lecce', region: 'Puglia' },
    { city: 'Pisa', region: 'Toscana' },
    { city: 'Siena', region: 'Toscana' },
    { city: 'Amalfi', region: 'Campania' },
    { city: 'Positano', region: 'Campania' },
    { city: 'Sorrento', region: 'Campania' },
    { city: 'Cortina', region: 'Veneto' },
    { city: 'Porto Cervo', region: 'Sardegna' },
    { city: 'Taormina', region: 'Sicilia' },
    { city: 'Pescatore', region: 'Lombardia' }, // Dal Pescatore
    { city: 'Pinetina', region: 'Lombardia' },
    { city: 'Piano 35', region: 'Piemonte' },
    { city: 'Azotea', region: 'Piemonte' }
];

// Add the region names as keywords themselves
const regions = [
    'Lombardia', 'Veneto', 'Piemonte', 'Lazio', 'Toscana', 'Campania', 'Sicilia', 'Sardegna', 'Puglia', 'Emilia-Romagna',
    'Liguria', 'Friuli-Venezia Giulia', 'Marche', 'Abruzzo', 'Trentino-Alto Adige', 'Umbria', 'Calabria', 'Basilicata', 'Molise', 'Valle d\'Aosta'
];

async function fixRegions() {
    console.log('--- STARTING REGION RECOVERY FROM NOMELOCALE ---');

    let grandTotal = 0;

    // 1. Map by Region names first (direct match)
    for (const region of regions) {
        const { count, error } = await supabase
            .from('menuitems')
            .update({ RegionMatch: region })
            .ilike('NomeLocale', `%${region}%`)
            .select('*', { count: 'exact', head: true });

        if (!error && count > 0) {
            console.log(`Matched ${count} rows by region name: ${region}`);
            grandTotal += count;
        }
    }

    // 2. Map by City names
    for (const item of cityRegionMap) {
        const { count, error } = await supabase
            .from('menuitems')
            .update({ RegionMatch: item.region })
            .ilike('NomeLocale', `%${item.city}%`)
            .or('RegionMatch.is.null,RegionMatch.eq.""') // Only fill empty ones
            .select('*', { count: 'exact', head: true });

        if (!error && count > 0) {
            console.log(`Matched ${count} rows for ${item.region} by city: ${item.city}`);
            grandTotal += count;
        }
    }

    // 3. Fallback: Check if there's anything left we can catch with common abbreviations at the end
    const abbrevMap = [
        { abbrev: ' MI', region: 'Lombardia' },
        { abbrev: ' TO', region: 'Piemonte' },
        { abbrev: ' RM', region: 'Lazio' },
        { abbrev: ' VE', region: 'Veneto' },
        { abbrev: ' FI', region: 'Toscana' },
        { abbrev: ' NA', region: 'Campania' }
    ];

    for (const item of abbrevMap) {
        const { count, error } = await supabase
            .from('menuitems')
            .update({ RegionMatch: item.region })
            .ilike('NomeLocale', `%${item.abbrev}%`)
            .or('RegionMatch.is.null,RegionMatch.eq.""')
            .select('*', { count: 'exact', head: true });

        if (!error && count > 0) {
            console.log(`Matched ${count} rows for ${item.region} by abbreviation: ${item.abbrev}`);
            grandTotal += count;
        }
    }

    console.log(`\n--- FIXED TOTAL: ${grandTotal} ROWS ---`);

    // Final check for nulls
    const { count: remaining } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true })
        .or('RegionMatch.is.null,RegionMatch.eq.""');

    console.log(`Remaining null regions: ${remaining}`);
}

fixRegions();
