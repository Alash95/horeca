import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasazkhohhtuiwuvsmuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F6a2hvaGh0dWl3dXZzbXVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDMyMSwiZXhwIjoyMDgzODc2MzIxfQ.1ChaFUvrsfcvt7MBID8RsNuLnoowEzcZuaCCeb96DNE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase
        .from('menuitems')
        .select(`"Item_Name", "Broad_category", "ingredients_categoria", "Category Name", "Sub_Category"`)
        .or(`"Item_Name".ilike.%cocktail%,Broad_category.ilike.%cocktail%,ingredients_categoria.ilike.%cocktail%,"Category Name".ilike.%cocktail%`)
        .limit(100);

    if (error) throw error;

    console.log("--- DATA SAMPLES ---");
    data.forEach(row => {
        // console.log(`SKIP: [${name}] | Broad: [${broad}] | Cat: [${cat}]`);
    }
    });
}

inspect();
