require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing Supabase Connection...");
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log("Supabase Connection Successful! Users count:", data); // data is null for head:true with count, but check 'count' property if returned or just no error.
    } catch (err) {
        console.error("Supabase Connection Failed:", err);
    }
}

test();
