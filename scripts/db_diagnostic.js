import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkDatabase() {
    console.log('📡 Querying menuitems table...');

    // 1. Get total count
    const { count, error: countError } = await supabase
        .from('menuitems')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error getting count:', countError.message);
    } else {
        console.log(`✅ Total records in menuitems: ${count}`);
    }

    // 2. Get 1 record to see headers
    const { data: sample, error: sampleError } = await supabase
        .from('menuitems')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('❌ Error getting sample:', sampleError.message);
    } else if (sample && sample.length > 0) {
        console.log('✅ Sample Data Headers:', Object.keys(sample[0]));
        console.log('✅ Sample Record:', JSON.stringify(sample[0], null, 2));
    }

    // 3. Get unique Regions and Cities
    const { data: regions, error: regError } = await supabase
        .from('menuitems')
        .select('RegionMatch, Città, City, venue_city');

    if (!regError && regions) {
        const uniqueRegions = [...new Set(regions.map(r => r.RegionMatch).filter(Boolean))];
        const uniqueCitta = [...new Set(regions.map(r => r.Città).filter(Boolean))];
        const uniqueCity = [...new Set(regions.map(r => r.City).filter(Boolean))];
        const uniqueVenueCity = [...new Set(regions.map(r => r.venue_city).filter(Boolean))];

        console.log('📡 Unique Regions:', uniqueRegions);
        console.log('📡 Unique Città (Italian):', uniqueCitta);
        console.log('📡 Unique City (English):', uniqueCity);
        console.log('📡 Unique venue_city:', uniqueVenueCity);
    }
}

checkDatabase();
