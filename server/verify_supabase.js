const supabase = require('./src/config/supabase');
require('dotenv').config();

const verifyConnection = async () => {
    console.log("Checking Supabase Connection...");
    try {
        // Simple select 1 row
        const { data, error } = await supabase.from('users').select('email').limit(1);

        if (error) {
            console.error("❌ Connection Failed:", error.message);
        } else {
            console.log("✅ Connection Successful!");
            if (data.length > 0) {
                console.log(`- Connection validated by fetching user: ${data[0].email}`);
            } else {
                console.log("- Connection validated (Table is empty).");
            }
        }
    } catch (err) {
        console.error("❌ Unexpected Error:", err.message);
    }
};

verifyConnection();
