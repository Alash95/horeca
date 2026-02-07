import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    // Try to insert a row with an invalid column to force an error that lists valid columns
    const { error } = await supabase.from('menuitems').insert({ "invalid_column_name_probe": true });

    if (error) {
        console.log('Error Message (should contain valid columns):', error.message);
        if (error.hint) console.log('Hint:', error.hint);
        if (error.details) console.log('Details:', error.details);
    } else {
        console.log('Insert succeeded? This shouldn\'t happen.');
    }
}

probe();
