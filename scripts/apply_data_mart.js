import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const sql = `
-- 1. Function to get total unique venues by region, city, and client type (The Market Universe)
CREATE OR REPLACE FUNCTION get_market_universe()
RETURNS TABLE (
    regione TEXT,
    citta TEXT,
    tipologia_cliente TEXT,
    venue_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE("RegionMatch", 'Unknown Region') as regione,
        COALESCE("Città", "City", "venue_city", 'Unknown City') as citta,
        COALESCE("TipologiaLocale", 'Unknown Type') as tipologia_cliente,
        COUNT(DISTINCT COALESCE("NomeLocale", "Venue_Name"))::BIGINT as venue_count
    FROM public.menuitems
    GROUP BY 1, 2, 3;
END;
$$;

-- 2. Function to get total listings by category (Market Benchmarks)
CREATE OR REPLACE FUNCTION get_market_benchmarks()
RETURNS TABLE (
    macro_categoria TEXT,
    categoria_prodotto TEXT,
    listing_count BIGINT,
    venue_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE("Broad_category", 'Other') as macro_categoria,
        COALESCE("ingredients_categoria", 'Generic') as categoria_prodotto,
        COUNT(*)::BIGINT as listing_count,
        COUNT(DISTINCT COALESCE("NomeLocale", "Venue_Name"))::BIGINT as venue_count
    FROM public.menuitems
    GROUP BY 1, 2;
END;
$$;

-- Grant EXECUTE to the anon/authenticated roles
GRANT EXECUTE ON FUNCTION get_market_universe() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_market_benchmarks() TO anon, authenticated;
`;

console.log('--- SQL START ---');
console.log(sql);
console.log('--- SQL END ---');
console.log('\n🚀 ACTION REQUIRED: Please run the SQL above in the Supabase SQL Editor.');
