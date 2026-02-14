
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
        if (key && key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value.trim();
    });
} catch (e) {
    console.error("Could not read .env.local", e);
}

if (!supabaseKey) {
    console.error("No Service Role Key found. Cannot bypass RLS.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking distinct cities...");

    // Check 'City' column
    const { data: cities, error: cityError } = await supabase
        .from('menuitems')
        .select('City')
        .not('City', 'is', null)
    //.limit(50); // Get a sample

    if (cityError) console.error("City Error:", cityError);
    else {
        const uniqueCities = [...new Set(cities.map(c => c.City).filter(Boolean))];
        console.log("Unique Cities (from 'City'):", uniqueCities.sort());
    }

    // Check 'venue_city' column
    const { data: venueCities, error: vCityError } = await supabase
        .from('menuitems')
        .select('venue_city')
        .not('venue_city', 'is', null)

    if (vCityError) console.error("Venue City Error:", vCityError);
    else {
        const uniqueVenueCities = [...new Set(venueCities.map(c => c.venue_city).filter(Boolean))];
        console.log("Unique Venue Cities (from 'venue_city'):", uniqueVenueCities.sort());
    }
}

check();
