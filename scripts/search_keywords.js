import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

const regions = ['Lombardia', 'Veneto', 'Piemonte', 'Lazio', 'Toscana', 'Campania', 'Sicilia', 'Sardegna', 'Puglia', 'Emilia-Romagna', 'Liguria', 'Friuli-Venezia Giulia', 'Marche', 'Abruzzo', 'Trentino-Alto Adige', 'Umbria', 'Calabria', 'Basilicata', 'Molise', 'Valle d\'Aosta'];
const cities = ['Milano', 'Milan', 'Venezia', 'Venice', 'Torino', 'Turin', 'Roma', 'Rome', 'Firenze', 'Florence', 'Napoli', 'Naples', 'Bari', 'Bologna', 'Genova', 'Genoa', 'Palermo', 'Verona'];

async function searchKeywords() {
    const { data, error } = await supabase
        .from('menuitems')
        .select('NomeLocale')
        .limit(1000);

    if (error) {
        console.error('Error:', error);
        return;
    }

    let foundCount = 0;
    data.forEach(row => {
        const name = row.NomeLocale || '';
        const foundRegion = regions.find(r => name.toLowerCase().includes(r.toLowerCase()));
        const foundCity = cities.find(c => name.toLowerCase().includes(c.toLowerCase()));

        if (foundRegion || foundCity) {
            foundCount++;
            if (foundCount < 20) {
                console.log(`Match found in [${name}]: ${foundRegion || foundCity}`);
            }
        }
    });

    console.log(`\nMatches found in ${foundCount} out of 1000 samples.`);
}

searchKeywords();
