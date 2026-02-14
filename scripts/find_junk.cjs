const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- AUDITING JUNK ITEMS: VENUE ASSOCIATIONS ---");

    // Search for # items and get venue names
    const { data, error } = await supabase
        .from('menuitems')
        .select(`"Item_Name", "NomeLocale", "City", "Category Name"`)
        .ilike('Item_Name', '#%')
        .limit(20);

    if (error) {
        console.error("Query error:", error);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(row => {
            console.log(`REAL DATA POINT: Name:[${row.Item_Name}] | Venue:[${row.NomeLocale}] | City:[${row.City}] | Cat:[${row['Category Name']}]`);
        });
    } else {
        console.log("No matching junk data found.");
    }
}

inspect();
