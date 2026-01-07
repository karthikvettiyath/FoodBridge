
const supabase = require('../src/config/supabase');

async function testConnection() {
    try {
        console.log("Probing 'donations' table...");

        // Insert a dummy to see if it allows the new columns, OR just select 
        // Supabase select doesn't return schema metadata easily in JS client without introspection.
        // We will try to INSERT a row with the new columns and see if it fails.
        // Or updated a row.

        const { data: list, error: listError } = await supabase.from('donations').select('*').limit(1);
        if (listError) console.error("List Error:", listError);
        else {
            if (list.length > 0) {
                console.log("Existing Columns:", Object.keys(list[0]));
            } else {
                console.log("Table empty, cannot check columns via select.");
            }
        }

    } catch (e) {
        console.error("Exception:", e);
    }
}

testConnection();
