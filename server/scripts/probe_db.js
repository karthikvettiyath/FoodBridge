
const supabase = require('../src/config/supabase');

async function testConnection() {
    try {
        console.log("Attempting to connect to Supabase...");
        const { data, error } = await supabase.from('donations').select('*').limit(1);
        if (error) {
            console.error("Error connecting:", error);
        } else {
            console.log("Connection successful!");
            if (data.length > 0) {
                console.log("Sample Data:", data[0]);
                console.log("Keys in donation:", Object.keys(data[0]));
            } else {
                console.log("Connected but donations table is empty.");
            }
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

testConnection();
