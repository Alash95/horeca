const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nasazkhohhtuiwuvsmuo.supabase.co', 'sb_publishable_kGDmB3jSckQLw94K2hKUkA__lWWZ7jC');

async function checkCategories() {
    const { data, error } = await supabase.from('menuitems').select('*').limit(10);
    if (error) {
        console.error(error);
        return;
    }

    // Log keys to see exact names
    if (data.length > 0) {
        console.log('Exact Columns:', Object.keys(data[0]));

        // Find Category Name column
        const catCol = Object.keys(data[0]).find(k => k.toLowerCase().includes('category') && k.toLowerCase().includes('name'));
        console.log('Found Category Column:', catCol);

        // Fetch all unique categories
        const { data: allCats, error: err2 } = await supabase.from('menuitems').select(catCol);
        if (err2) console.error(err2);
        else {
            const unique = new Set(allCats.map(d => d[catCol]));
            console.log('Unique Categories:', Array.from(unique));
        }
    }
}

checkCategories();
